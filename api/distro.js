/* =========================================================
   Distribution form → email with the cover art attached and a
   link to the track.

   Runs on Vercel's Edge runtime purely so `request.formData()`
   is available natively — that keeps the project dependency-free
   and with no build step, same as the rest of the site.

   NOTE on the track: it never reaches this function's body at all.
   Vercel caps every request at 4.5 MB regardless of what the code
   does with it, so a real WAV can't ride along as a form field —
   the browser uploads it straight to Vercel Blob before submitting
   (see api/blob-upload.js and js/main.js), and this only receives
   the resulting URL as a plain text field.

   Needs one environment variable in the Vercel project:
     RESEND_API_KEY — from resend.com
   ========================================================= */
export const config = { runtime: 'edge' };

const MAIL_TO = 'offmstpd@gmail.com';
/* mstpd.com is verified on Resend, so this can send to any recipient —
   not just the Resend account owner, as the shared onboarding@resend.dev
   sender is restricted to. */
const MAIL_FROM = 'MSTPD site <mail@mstpd.com>';

const MAX_BYTES = 4 * 1024 * 1024;          // stays under Vercel's request cap

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

/* ── one-time form token ───────────────────────────────────
   A GET hands out a signed timestamp; a POST is only accepted with a
   valid, recent one. The point is not cryptographic strength — it's that
   getting a token requires making a request the drive-by spam bots never
   make: they POST straight here without ever loading the page.

   Signed with FORM_SECRET when set, otherwise with the Resend key, which
   is already configured on both hosts — the secret never leaves the
   server and the token reveals nothing about it, so this needs no new
   configuration to start working. */
const TOKEN_MIN_AGE = 3 * 1000;             // a human can't fill the form faster
const TOKEN_MAX_AGE = 2 * 60 * 60 * 1000;   // and shouldn't take longer than this

const formSecret = () => process.env.FORM_SECRET || process.env.RESEND_API_KEY || '';

const signStamp = async stamp => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(formSecret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(stamp)));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
};

const tokenValid = async token => {
  const [stamp, sig] = String(token || '').split('.');
  if (!stamp || !sig || !/^\d+$/.test(stamp)) return false;

  const age = Date.now() - Number(stamp);
  if (age < TOKEN_MIN_AGE || age > TOKEN_MAX_AGE) return false;

  const expected = await signStamp(stamp);
  // length-independent compare, so a mismatch tells nothing by how long it took
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const escapeHtml = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* btoa() on a multi-megabyte binary string blows the call stack if the
   whole array is spread at once, so walk it in chunks. */
const toBase64 = buffer => {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
};

export default async function handler(request) {
  // the page asks for a token here as the modal opens
  if (request.method === 'GET') {
    const stamp = Date.now();
    return json({ token: `${stamp}.${await signStamp(stamp)}` });
  }
  if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed.' }, 405);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json({ success: false, message: 'Mail service is not configured yet.' }, 500);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ success: false, message: 'Could not read the submission.' }, 400);
  }

  if (form.get('botcheck')) return json({ success: true });   // honeypot: look successful, send nothing

  if (!(await tokenValid(form.get('formtoken')))) {
    return json({ success: false, message: 'This form expired — please reopen it and try again.' }, 400);
  }

  /* hCaptcha. Only enforced once HCAPTCHA_SECRET is set, so the form keeps
     working before the keys exist — but note that until then this endpoint
     is open to a direct POST, which is how the spam was arriving: a bot
     that never loads the page simply omits the honeypot and sails through.
     The token is what can't be faked without a browser. */
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
  if (hcaptchaSecret) {
    const token = (form.get('h-captcha-response') || '').toString();
    if (!token) return json({ success: false, message: 'Please confirm you\'re not a robot.' }, 400);

    const verify = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: hcaptchaSecret, response: token }),
    }).then(r => r.json()).catch(() => null);

    if (!verify || verify.success !== true) {
      return json({ success: false, message: 'Captcha check failed — please try again.' }, 400);
    }
  }

  const value = k => (form.get(k) || '').toString().trim();

  const missing = REQUIRED.filter(k => !value(k));
  if (missing.length) return json({ success: false, message: 'Please fill in every required field.' }, 400);

  /* The cover is optional, and its format and dimensions aren't policed —
     only its size, which is about what an email can carry rather than
     anything to do with the artwork. */
  const cover = form.get('cover');
  const attachments = [];
  if (cover && typeof cover === 'object' && cover.size > 0) {
    if (cover.size > MAX_BYTES) {
      return json({ success: false, message: 'Cover is larger than 4 MB.' }, 400);
    }
    attachments.push({
      filename: cover.name || 'cover.jpg',
      content: toBase64(await cover.arrayBuffer()),
      content_type: cover.type || 'application/octet-stream',
    });
  }

  const row = (label, cell) => `<tr>
      <td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">${cell}</td>
    </tr>`;
  const textRows = list => list.map(([key, label]) => row(label, escapeHtml(value(key) || '—'))).join('');

  const coverNote = (cover && typeof cover === 'object' && cover.size > 0)
    ? `${escapeHtml(cover.name)} — attached (${Math.round(cover.size / 1024)} KB)`
    : 'not provided';

  /* Uploaded client-side straight to Vercel Blob — see the note at the top
     of the file. A link rather than an attachment, so there's no size
     ceiling worth naming here at all. */
  const audioUrl = value('audioUrl');
  const audioNote = audioUrl
    ? `<a href="${escapeHtml(audioUrl)}">${escapeHtml(audioUrl)}</a>`
    : 'not provided';

  /* Lyrics sit below the table, not in it: they run to dozens of lines,
     which a two-column row would squeeze. pre-wrap is what keeps the line
     breaks — escaping alone leaves them to collapse as HTML whitespace. */
  const lyrics = value('lyrics');
  const lyricsBlock = lyrics ? `
    <div style="margin-top:26px;border-top:1px solid #e6e3de;padding-top:18px">
      <p style="margin:0 0 10px;color:#8b8780;font:12px ui-monospace,monospace">Lyrics</p>
      <div style="white-space:pre-wrap;color:#111;font:15px/1.55 -apple-system,Segoe UI,sans-serif">${escapeHtml(lyrics)}</div>
    </div>` : '';

  const html = `<div style="font:15px -apple-system,Segoe UI,sans-serif;color:#111">
    <p style="margin:0 0 20px">New release submitted for distribution.</p>
    <table style="border-collapse:collapse">${textRows(NUMBERED)}${row('10 Cover art', coverNote)}${textRows(EXTRA)}${row('Track audio', audioNote)}
    </table>${lyricsBlock}
  </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [MAIL_TO],
      reply_to: value('email'),
      subject: `New release — ${value('artist')} — ${value('release')}`,
      html,
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return json({ success: false, message: 'Mail service rejected the message.', detail }, 502);
  }

  return json({ success: true });
}
