# Backlog

A personal SAPS firearm-licence application & digital safe tracker.
**Static React SPA + PHP backend.** Built to drop into any cPanel /
shared-hosting account — no Node.js required on the server.

## Local development

```bash
npm install
npm run dev
```

- `npm run dev` runs Vite on http://localhost:8080 **and** a tiny Node
  Express SAPS proxy on http://localhost:3001 (same endpoints as the
  PHP files, so the frontend code is identical in dev and prod).
- Vite proxies `/api/*` to the local Node proxy in dev.

If you only want the frontend:

```bash
npm run dev:web
```

## Production build (drop into cPanel)

```bash
npm run build
```

Then upload the **entire contents of `dist/`** into your cPanel folder
(typically `public_html`). The build already includes:

- `index.html` and hashed JS/CSS bundles
- `api/check-status.php` and `api/healthcheck.php`
- `.htaccess` with SPA fallback + pretty `/api/...` URLs

Requirements on the server:
- PHP 7.4+ with the `curl` and `dom` extensions enabled (standard on cPanel).
- Apache with `mod_rewrite` enabled (also standard on cPanel).

After upload, visit your domain — the frontend renders from `/` and the
"Check" buttons call the PHP endpoints automatically.

## Project layout

```
public/             static assets copied verbatim to dist/
  api/              PHP backend (deployed alongside the SPA)
  .htaccess         SPA fallback + URL rewrites
src/
  App.tsx           routes (react-router-dom)
  routes/           page components
  components/       UI
  lib/              storage, dates, SAPS client, etc.
server/
  saps-proxy.ts     local-dev-only Express mirror of the PHP backend
```

## License

Free & open source.
