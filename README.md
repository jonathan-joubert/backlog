# Backlog

A personal SAPS firearm-licence application & digital safe tracker.
**Pure static SPA (React + Vite) + PHP API files.** No Node.js required
on the server — drop the built `dist/` folder into any cPanel /
shared-hosting account and you're done.

## Local development

```bash
npm install
npm run dev
```

Vite serves the frontend on http://localhost:8080 and a built-in dev
middleware mirrors the production PHP endpoints (`/api/check-status`,
`/api/healthcheck`) so no extra processes are needed. The frontend
code is identical in dev and production.

## Production build (drop into cPanel)

```bash
npm run build
```

Then upload the **entire contents of `dist/`** into your cPanel folder
(typically `public_html`). The build already includes:

- `index.html` and hashed JS/CSS bundles
- `api/check-status.php` and `api/healthcheck.php`
- `.htaccess` with SPA fallback + pretty `/api/...` URLs
- PWA manifest and icons

Requirements on the server:

- PHP 7.4+ with the `curl` and `dom` extensions (standard on cPanel).
- Apache with `mod_rewrite` (standard on cPanel).

## Project layout

```
public/       static assets copied verbatim to dist/
  api/        PHP backend (deployed alongside the SPA)
  .htaccess   SPA fallback + URL rewrites
src/
  App.tsx     routes (react-router-dom)
  routes/     page components
  components/ UI
  lib/        storage, dates, SAPS client, etc.
```

## License

Free & open source.
