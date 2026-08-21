/* =========================================================
   Issues the short-lived token @vercel/blob needs to authorize a
   direct browser → Vercel Blob upload, and receives the completion
   webhook. Exists purely so the track never has to pass through
   api/distro's own request body — that's what was capped at 4.5 MB
   on every Vercel plan, the wall a real WAV always hit.

   Shared by BOTH hosts: mstpd.com (IONOS) has no Vercel Blob store
   of its own, so its page calls this endpoint too, cross-origin —
   purely for the token. The file itself still goes straight from
   the browser to Vercel's storage, never through either backend.

   Needs BLOB_READ_WRITE_TOKEN in the Vercel project's env, added
   automatically when the Blob store is connected to the project.

   Plain Node runtime (the default — no `config` export), not edge:
   handleUpload's signature verification pulls in node:crypto and
   friends, which the edge runtime doesn't support. That means the
   classic Vercel (req, res) signature here, not Web Request/Response —
   req is an IncomingMessage, not a Request, so handleUpload (which
   wants a real Request) gets a small one built from it below. */

import { handleUpload } from '@vercel/blob/client';

/* Same two hosts the rest of the API allowlists nothing else for —
   this isn't a public endpoint, just one two front-ends share. */
const ALLOWED_ORIGINS = new Set([
  'https://mstpd.com',
  'https://www.mstpd.com',
  'https://mstpd-portfolio.vercel.app',
]);

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.has(origin) ? origin : 'https://mstpd.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // the browser preflights a cross-origin POST with a JSON content-type
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // Vercel parses a JSON body onto req.body for Node functions already;
  // handleUpload just wants a real Request alongside it, for the headers
  // it reads when verifying the completion webhook's signature.
  const request = new Request(`https://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers,
  });

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['audio/*', 'application/octet-stream'],
        addRandomSuffix: true,
        // public: the resulting link goes straight into an email —
        // whoever opens it there has no Vercel session to authenticate with
        access: 'public',
      }),
      // required by handleUpload's signature; nothing to do with the
      // result here, the browser already has the URL from upload() itself
      onUploadCompleted: async () => {},
    });
    res.status(200).json(jsonResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
