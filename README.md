# Backlog

A private, open-source single-page app for saving SAPS firearm licence applications
on one device and checking their status. No analytics, tracking cookies, user
accounts, or production Node.js server are used.

## Local development

```bash
npm install
npm run dev      # dev server
npm run build    # outputs dist/
npm run preview  # serve the production build locally
```

## Deploying to cPanel / Apache

1. `npm install && npm run build`
2. Upload **everything inside `dist/`** (including the hidden `.htaccess`
   file) into `public_html/backlog.fibco.co.za/`
3. Open https://backlog.fibco.co.za — done.

The `.htaccess` makes Apache serve `index.html` for client-side routes, so
deep links don't 404.

## SAPS status checks (proxy.php)

Browsers cannot call the SAPS portal directly (it blocks cross-origin
requests), and this app has no server. To make "Check status" work:

1. Upload `cpanel-extras/proxy.php` into `public_html/backlog.fibco.co.za/`
   (it's a tiny PHP forwarder to `www.saps.gov.za` — cPanel runs PHP natively).
2. Create a `.env` file in the project root before building:
   ```
   VITE_SAPS_PROXY_URL=https://backlog.fibco.co.za/proxy.php
   ```
3. `npm run build` and re-upload `dist/`.

Without the proxy the app still works for saving and organising applications;
status checks will show a message explaining the proxy is not configured.
