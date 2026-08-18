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
