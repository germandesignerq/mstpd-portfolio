<?php
/* Distribution form → email with the cover art attached and a link to
   the track.

   PHP port of api/distro.js — shared hosts without a persistent Node
   runtime (e.g. IONOS Web Hosting) can't run the Vercel Edge function,
   so this calls the same Resend HTTP API via curl instead of fetch.
   The JSON contract matches distro.js exactly, so js/main.js needs no
   per-host branching.

   The track itself never reaches this script: the browser uploads it
   straight to Vercel Blob before submitting (js/main.js, api/blob-upload.js
   on the Vercel host — mstpd.com has no Blob store of its own, so this
   page's JS calls that endpoint cross-origin just for the upload token).
   This only ever sees the resulting URL, as a plain POST field.

   Needs RESEND_API_KEY, defined in a config file kept OUTSIDE the web
   root (see distro-config.example.php for the expected path/format). */

header('Content-Type: application/json');

function respond($body, $status = 200) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

$configPath = __DIR__ . '/../../distro-config.php';
$RESEND_API_KEY = null;
if (is_file($configPath)) require $configPath;

/* ── one-time form token ───────────────────────────────────
   A GET hands out a signed timestamp; a POST is only accepted with a
   valid, recent one. The point is not cryptographic strength — it's that
   getting a token requires making a request the drive-by spam bots never
   make: they POST straight here without ever loading the page.

   Signed with $FORM_SECRET when set, otherwise with the Resend key, which
   is already in the same config — the secret never leaves the server and
   the token reveals nothing about it, so this needs no new setup. */
const TOKEN_MIN_AGE = 3;            // seconds; a human can't fill the form faster
const TOKEN_MAX_AGE = 2 * 60 * 60;  // and shouldn't take longer than this

$formSecret = (!empty($FORM_SECRET) ? $FORM_SECRET : $RESEND_API_KEY) ?: '';
$signStamp = fn($stamp) => substr(hash_hmac('sha256', (string) $stamp, $formSecret), 0, 32);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stamp = time();
    respond(['token' => $stamp . '.' . $signStamp($stamp)]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}

if (empty($RESEND_API_KEY)) {
    respond(['success' => false, 'message' => 'Mail service is not configured yet.'], 500);
}

const MAIL_TO = 'offmstpd@gmail.com';
/* Resend's shared sender. Works with no DNS setup, but only delivers
   to the address that owns the Resend account — which is MAIL_TO here.
   Swap for an address on a verified domain to send anywhere. */
const MAIL_FROM = 'MSTPD site <mail@mstpd.com>';

const MAX_BYTES = 4 * 1024 * 1024;

/* Labels double as the running order of the email body. */
/* Two groups so the email reads in the same order as the form: the ten
   numbered fields the release brief asks for, then everything added on
   top of it. The cover is number 10 and slots between them, because it's
   an attachment rather than a text value. */
const NUMBERED = [
    ['artist',    '01 Artist (legal name)'],
    ['release',   '02 Release'],
    ['version',   '03 Version / subtitle'],
    ['performer', '04 Main performer(s)'],
    ['feat',      '05 Featuring'],
    ['genre',     '06 Genre'],
    ['subgenre',  '07 Subgenre'],
    ['format',    '08 Format'],
    ['explicit',  '09 Explicit'],
];
const EXTRA = [
    ['email',     'Email'],
    ['contact',   'Telegram / Instagram'],
    ['producer',  'Producer'],
    ['adm',       'Apple Digital Mastering'],
    ['snippet',   'TikTok / Instagram start'],
];

/* Email only — it's the reply address. The form stopped requiring the
   rest, and rejecting here what the browser lets through would just be a
   worse-timed version of the same refusal. */
const REQUIRED = ['email'];

if (!empty($_POST['botcheck'])) respond(['success' => true]); // honeypot: look successful, send nothing

$parts = explode('.', (string) ($_POST['formtoken'] ?? ''), 2);
$stamp = $parts[0] ?? '';
$sig   = $parts[1] ?? '';
$age   = ctype_digit($stamp) ? time() - (int) $stamp : null;
if ($age === null || $age < TOKEN_MIN_AGE || $age > TOKEN_MAX_AGE
    || !hash_equals($signStamp($stamp), $sig)) {   // hash_equals: constant time
    respond(['success' => false, 'message' => 'This form expired — please reopen it and try again.'], 400);
}

/* hCaptcha. Only enforced once $HCAPTCHA_SECRET is defined in the same
   config file as the Resend key, so the form keeps working before the keys
   exist — but note that until then this endpoint is open to a direct POST,
   which is how the spam was arriving: a bot that never loads the page
   simply omits the honeypot and sails through. The token is what can't be
   faked without a browser. */
if (!empty($HCAPTCHA_SECRET)) {
    $token = trim($_POST['h-captcha-response'] ?? '');
    if ($token === '') {
        respond(['success' => false, 'message' => "Please confirm you're not a robot."], 400);
    }

    $vch = curl_init('https://api.hcaptcha.com/siteverify');
    curl_setopt_array($vch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => http_build_query(['secret' => $HCAPTCHA_SECRET, 'response' => $token]),
    ]);
    $vres = curl_exec($vch);
    curl_close($vch);
    $verify = json_decode($vres ?: '', true);

    if (empty($verify['success'])) {
        respond(['success' => false, 'message' => 'Captcha check failed — please try again.'], 400);
    }
}

$value = fn($k) => trim($_POST[$k] ?? '');

$missing = array_filter(REQUIRED, fn($k) => $value($k) === '');
if ($missing) respond(['success' => false, 'message' => 'Please fill in every required field.'], 400);

/* The cover's format and dimensions aren't
   policed — only its size, which is about what an email can carry rather
   than anything to do with the artwork. */
$attachments = [];
$coverName = null;
$coverSize = 0;
if (!empty($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK && $_FILES['cover']['size'] > 0) {
    $cover = $_FILES['cover'];
    $coverName = $cover['name'];
    $coverSize = $cover['size'];

    if ($cover['size'] > MAX_BYTES) {
        respond(['success' => false, 'message' => 'Cover is larger than 4 MB.'], 400);
    }

    $type = (function_exists('mime_content_type') ? mime_content_type($cover['tmp_name']) : null)
        ?: ($cover['type'] ?: 'application/octet-stream');

    $attachments[] = [
        'filename' => $coverName ?: 'cover.jpg',
        'content' => base64_encode(file_get_contents($cover['tmp_name'])),
        'content_type' => $type,
    ];
}

$escape = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

$row = fn($label, $cell) => '<tr>'
    . '<td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">' . $escape($label) . '</td>'
    . '<td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">' . $cell . '</td>'
    . '</tr>';

$textRows = function (array $list) use ($value, $escape, $row) {
    $out = '';
    foreach ($list as [$key, $label]) {
        $v = $value($key);
        $out .= $row($label, $escape($v !== '' ? $v : '—'));
    }
    return $out;
};

$coverNote = $coverName
    ? $escape($coverName) . ' — attached (' . round($coverSize / 1024) . ' KB)'
    : 'not provided';

/* Uploaded client-side straight to Vercel Blob — see the note at the top
   of the file. A link rather than an attachment, so there's no size
   ceiling worth naming here at all. */
$audioUrl = $value('audioUrl');
$audioNote = $audioUrl !== ''
    ? '<a href="' . $escape($audioUrl) . '">' . $escape($audioUrl) . '</a>'
    : 'not provided';

/* Lyrics sit below the table, not in it: they run to dozens of lines,
   which a two-column row would squeeze. pre-wrap is what keeps the line
   breaks — escaping alone leaves them to collapse as HTML whitespace. */
$lyrics = $value('lyrics');
$lyricsBlock = $lyrics === '' ? '' :
    '<div style="margin-top:26px;border-top:1px solid #e6e3de;padding-top:18px">'
    . '<p style="margin:0 0 10px;color:#8b8780;font:12px ui-monospace,monospace">Lyrics</p>'
    . '<div style="white-space:pre-wrap;color:#111;font:15px/1.55 -apple-system,Segoe UI,sans-serif">' . $escape($lyrics) . '</div>'
    . '</div>';

$html = '<div style="font:15px -apple-system,Segoe UI,sans-serif;color:#111">'
    . '<p style="margin:0 0 20px">New release submitted for distribution.</p>'
    . '<table style="border-collapse:collapse">'
    . $textRows(NUMBERED)
    . $row('10 Cover art', $coverNote)
    . $textRows(EXTRA)
    . $row('Track audio', $audioNote)
    . '</table>' . $lyricsBlock . '</div>';

$payload = [
    'from' => MAIL_FROM,
    'to' => [MAIL_TO],
    'reply_to' => $value('email'),
    'subject' => 'New release — ' . $value('artist') . ' — ' . $value('release'),
    'html' => $html,
];
if ($attachments) $payload['attachments'] = $attachments;

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $RESEND_API_KEY,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError || $httpCode < 200 || $httpCode >= 300) {
    respond(['success' => false, 'message' => 'Mail service rejected the message.', 'detail' => $curlError ?: $result], 502);
}

respond(['success' => true]);
