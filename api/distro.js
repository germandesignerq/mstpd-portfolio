/* =========================================================
   Distribution form → email with the cover art attached.

   Runs on Vercel's Edge runtime purely so `request.formData()`
   is available natively — that keeps the project dependency-free
   and with no build step, same as the rest of the site.

   Needs one environment variable in the Vercel project:
     RESEND_API_KEY — from resend.com
   ========================================================= */
export const config = { runtime: 'edge' };

const MAIL_TO = 'offmstpd@gmail.com';
/* Resend's shared sender. Works with no DNS setup, but only delivers
   to the address that owns the Resend account — which is MAIL_TO here.
   Swap for an address on a verified domain to send anywhere. */
const MAIL_FROM = 'MSTPD site <onboarding@resend.dev>';

const MAX_BYTES = 4 * 1024 * 1024;          // stays under Vercel's request cap
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
];

const REQUIRED = ['artist', 'email', 'release', 'performer', 'genre'];

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

  const value = k => (form.get(k) || '').toString().trim();

  const missing = REQUIRED.filter(k => !value(k));
  if (missing.length) return json({ success: false, message: 'Please fill in every required field.' }, 400);

  /* Cover art is optional here — the browser already enforces the
     dimension rules, and a submission shouldn't be lost if it can't. */
  const cover = form.get('cover');
  const attachments = [];
  if (cover && typeof cover === 'object' && cover.size > 0) {
    if (!ALLOWED.includes(cover.type)) {
      return json({ success: false, message: 'Cover must be a JPEG or PNG.' }, 400);
    }
    if (cover.size > MAX_BYTES) {
      return json({ success: false, message: 'Cover is larger than 4 MB.' }, 400);
    }
    attachments.push({
      filename: cover.name || 'cover.jpg',
      content: toBase64(await cover.arrayBuffer()),
    });
  }

  const rows = FIELDS.map(([key, label]) => {
    const v = value(key) || '—';
    return `<tr>
      <td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">${escapeHtml(v)}</td>
    </tr>`;
  }).join('');

  const coverNote = attachments.length
    ? `${escapeHtml(cover.name)} — attached (${Math.round(cover.size / 1024)} KB)`
    : 'not provided';

  const html = `<div style="font:15px -apple-system,Segoe UI,sans-serif;color:#111">
    <p style="margin:0 0 20px">New release submitted for distribution.</p>
    <table style="border-collapse:collapse">${rows}
      <tr>
        <td style="padding:6px 16px 6px 0;color:#8b8780;font:12px ui-monospace,monospace;white-space:nowrap;vertical-align:top">Cover art</td>
        <td style="padding:6px 0;color:#111;font:15px -apple-system,Segoe UI,sans-serif">${coverNote}</td>
      </tr>
    </table>
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
