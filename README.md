# WBSA static website (GitHub Pages + optional Vercel APIs)

This repo is a static website for the Wood Buffalo Somali Association (WBSA).

## Contact details in the site
- Email: Info@wbsa.ca
- Phone: 587-536-1335
- Address: 10012 Franklin Ave Unit 207, Fort McMurray, AB T9H 2K6

## Deploy (two common options)

### Option A — GitHub Pages (static only)
- Works immediately as a static site.
- The contact form automatically falls back to opening an email if the API endpoints are not available.

### Option B — Vercel (static + /api)
- Import this repo into Vercel.
- Add environment variables:
  - RESEND_API_KEY
  - CONTACT_TO=Info@wbsa.ca
  - CONTACT_FROM=WBSA Website <no-reply@wbsa.ca>  (must be a verified sender in Resend)
  - (optional) ALLOWED_ORIGINS=https://wbsa.ca,https://www.wbsa.ca

The website calls:
- POST /api/contact
- POST /api/subscribe

## Files
- index.html
- assets/css/styles.css
- assets/js/app.js
- api/contact.js
- api/subscribe.js
- vercel.json


## Note
This site uses a single non-module JS file so it will also work when you open `index.html` directly (file://).

## Quick test (local)
1) Unzip the repo to a folder
2) Open `index.html` (or `preview-standalone.html`) in your browser

If you open only an HTML file without the `assets/` folder beside it, it will look unstyled. Use the unzipped folder.
