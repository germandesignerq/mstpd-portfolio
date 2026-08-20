<?php
/* Template for the real distro-config.php.

   On the server this file must live OUTSIDE the web root — one level
   above the docroot (public/) — so it's never reachable over HTTP,
   e.g.:

     ~/distro-config.php        ← real file, holds the key, not in git
     ~/public/index.html
     ~/public/api/distro.php    ← reads ../../distro-config.php

   Copy this file there, rename it, and fill in the real key from
   https://resend.com. */

$RESEND_API_KEY = 're_...';

/* Optional. Set this and the distribution form starts requiring an
   hCaptcha token; leave it out and nothing is enforced.
   Secret key from https://dashboard.hcaptcha.com — the matching *site*
   key goes in js/main.js as HCAPTCHA_SITE_KEY. */
$HCAPTCHA_SECRET = '';

/* Optional. Signs the one-time form token. Leave it out and the Resend
   key above is used instead, which works fine — set this only if you'd
   rather the two secrets be separate. */
$FORM_SECRET = '';
