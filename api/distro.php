<?php
/* Distribution form → email with the cover art and the track attached.

   PHP port of api/distro.js — shared hosts without a persistent Node
   runtime (e.g. IONOS Web Hosting) can't run the Vercel Edge function,
   so this calls the same Resend HTTP API via curl instead of fetch.
   The JSON contract matches distro.js exactly, so js/main.js needs no changes.

   This is the backend that can actually take a WAV: Vercel refuses any
   request body over 4.5 MB on every plan, while here the ceiling is this
   server's own post_max_size / upload_max_filesize. If a submission with
   a track comes back empty-handed, those two are the first thing to
   check — PHP discards an oversized upload before this script runs, so
   the check below reports it rather than sending a half-empty email.

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
/* Resend allows 40 MB per email *after* base64, which inflates by a third,
   so the raw file has to stay near 28 — same number the browser enforces. */
const AUDIO_MAX_BYTES = 28 * 1024 * 1024;

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
];

const REQUIRED = ['artist', 'email', 'release', 'performer', 'genre'];

if (!empty($_POST['botcheck'])) respond(['success' => true]); // honeypot: look successful, send nothing

$value = fn($k) => trim($_POST[$k] ?? '');

$missing = array_filter(REQUIRED, fn($k) => $value($k) === '');
if ($missing) respond(['success' => false, 'message' => 'Please fill in every required field.'], 400);

/* An upload larger than post_max_size arrives with $_POST and $_FILES both
   empty, and an oversized single file arrives as UPLOAD_ERR_INI_SIZE — say
   so rather than quietly mailing a submission with no track in it. */
if (!empty($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_INI_SIZE) {
    respond(['success' => false, 'message' => 'The track is larger than this server accepts.'], 413);
}

/* Both files are optional here — the browser already enforces the format
   rules, and a submission shouldn't be lost if it can't. */
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

$audioName = null;
$audioSize = 0;
if (!empty($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK && $_FILES['audio']['size'] > 0) {
    $audio = $_FILES['audio'];
    $audioName = $audio['name'];
    $audioSize = $audio['size'];

    if ($audio['size'] > AUDIO_MAX_BYTES) {
        respond(['success' => false, 'message' => 'Track is larger than 28 MB.'], 400);
    }

    $attachments[] = [
        'filename' => $audioName ?: 'track.wav',
        'content' => base64_encode(file_get_contents($audio['tmp_name'])),
        'content_type' => 'audio/wav',
    ];
}

$escape = fn($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');

$rows = '';
foreach (FIELDS as [$key, $label]) {
    $v = $value($key);
    $rows .= '<tr>'
        . '<td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">' . $escape($label) . '</td>'
        . '<td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">' . $escape($v !== '' ? $v : '—') . '</td>'
        . '</tr>';
}

$fileNote = fn($name, $size) => $name
    ? $escape($name) . ' — attached (' . round($size / 1024) . ' KB)'
    : 'not provided';
$coverNote = $fileNote($coverName, $coverSize);
$audioNote = $fileNote($audioName, $audioSize);

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
    . '<table style="border-collapse:collapse">' . $rows
    . '<tr><td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">Track audio</td>'
    . '<td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">' . $audioNote . '</td></tr>'
    . '<tr><td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">Cover art</td>'
    . '<td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">' . $coverNote . '</td></tr>'
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
