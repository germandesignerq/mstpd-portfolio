<?php
/* Distribution form → email with the cover art attached.
   The track audio travels as a link, not an attachment — a WAV master
   runs 30-50+ MB, well past what api/distro.js's Vercel Edge function
   can receive at all (a hard 4.5 MB request-body cap on every plan).
   This PHP host's own post_max_size might allow more, but the form
   uses the same "Track audio" link field either way so the two
   backends behave identically.

   PHP port of api/distro.js — shared hosts without a persistent Node
   runtime (e.g. IONOS Web Hosting) can't run the Vercel Edge function,
   so this calls the same Resend HTTP API via curl instead of fetch.
   The JSON contract matches distro.js exactly, so js/main.js needs no changes.

   Needs RESEND_API_KEY, defined in a config file kept OUTSIDE the web
   root (see distro-config.example.php for the expected path/format). */

header('Content-Type: application/json');

function respond($body, $status = 200) {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed.'], 405);
}

$configPath = __DIR__ . '/../../distro-config.php';
$RESEND_API_KEY = null;
if (is_file($configPath)) require $configPath;
if (empty($RESEND_API_KEY)) {
    respond(['success' => false, 'message' => 'Mail service is not configured yet.'], 500);
}

const MAIL_TO = 'offmstpd@gmail.com';
/* Resend's shared sender. Works with no DNS setup, but only delivers
   to the address that owns the Resend account — which is MAIL_TO here.
   Swap for an address on a verified domain to send anywhere. */
const MAIL_FROM = 'MSTPD site <mail@mstpd.com>';

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png'];

/* Labels double as the running order of the email body. */
const FIELDS = [
    ['artist',    'Artist (legal name)'],
    ['email',     'Email'],
    ['release',   'Release'],
    ['version',   'Version / subtitle'],
    ['performer', 'Main performer(s)'],
    ['feat',      'Featuring'],
    ['genre',     'Genre'],
    ['subgenre',  'Subgenre'],
    ['format',    'Format'],
    ['explicit',  'Explicit'],
    ['adm',       'Apple Digital Mastering'],
    ['contact',   'Telegram / Instagram'],
    ['audio',     'Audio (WAV link)'],
];

const REQUIRED = ['artist', 'email', 'release', 'performer', 'genre'];

if (!empty($_POST['botcheck'])) respond(['success' => true]); // honeypot: look successful, send nothing

$value = fn($k) => trim($_POST[$k] ?? '');

$missing = array_filter(REQUIRED, fn($k) => $value($k) === '');
if ($missing) respond(['success' => false, 'message' => 'Please fill in every required field.'], 400);

/* Cover art is optional here — the browser already enforces the
   dimension rules, and a submission shouldn't be lost if it can't. */
$attachments = [];
$coverName = null;
$coverSize = 0;
if (!empty($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK && $_FILES['cover']['size'] > 0) {
    $cover = $_FILES['cover'];
    $coverName = $cover['name'];
    $coverSize = $cover['size'];

    $type = (function_exists('mime_content_type') ? mime_content_type($cover['tmp_name']) : null) ?: $cover['type'];
    if (!in_array($type, ALLOWED, true)) {
        respond(['success' => false, 'message' => 'Cover must be a JPEG or PNG.'], 400);
    }
    if ($cover['size'] > MAX_BYTES) {
        respond(['success' => false, 'message' => 'Cover is larger than 4 MB.'], 400);
    }

    $attachments[] = [
        'filename' => $coverName ?: 'cover.jpg',
        'content' => base64_encode(file_get_contents($cover['tmp_name'])),
        'content_type' => $type,
    ];
}

$escape = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

$rows = '';
foreach (FIELDS as [$key, $label]) {
    $v = $value($key);
    /* the audio field is a WAV link, not an attachment — make it
       clickable. Scheme-checked rather than trusted as-is: the browser's
       type="url" input only validates client-side. */
    $cell = ($key === 'audio' && preg_match('#^https?://#i', $v))
        ? '<a href="' . $escape($v) . '" style="color:#111">' . $escape($v) . '</a>'
        : $escape($v !== '' ? $v : '—');
    $rows .= '<tr>'
        . '<td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">' . $escape($label) . '</td>'
        . '<td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">' . $cell . '</td>'
        . '</tr>';
}

$coverNote = $attachments
    ? $escape($coverName) . ' — attached (' . round($coverSize / 1024) . ' KB)'
    : 'not provided';

$html = '<div style="font:15px -apple-system,Segoe UI,sans-serif;color:#111">'
    . '<p style="margin:0 0 20px">New release submitted for distribution.</p>'
    . '<table style="border-collapse:collapse">' . $rows
    . '<tr><td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">Cover art</td>'
    . '<td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">' . $coverNote . '</td></tr>'
    . '</table></div>';

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
