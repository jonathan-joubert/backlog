# Backlog

Local-first SAPS firearm licence application tracker. Pure JavaScript stack
(React + Vite frontend, tiny Node server for the SAPS scrape proxy). All user
data lives in the browser's `localStorage` — nothing is sent anywhere except
the SAPS status enquiry itself.

## Requirements

- Node.js 18+ (uses the built-in `fetch` and `undici`).

## Local development

```bash
npm install
npm run dev
```

Vite serves the SPA on <http://localhost:8080> and handles `/api/healthcheck`
and `/api/check-status` in-process via a dev middleware — no separate server
needed.

## Production build & deploy (Node hosting, e.g. cPanel Node.js app)

```bash
npm install
npm run build   # outputs dist/
npm start       # runs server/index.mjs on PORT (default 3000)
```

Upload the project (or at minimum `dist/`, `server/`, `package.json`) to the
host, run `npm install --omit=dev`, then start `node server/index.mjs`.
The server serves the built SPA and the `/api/*` endpoints on the same port.

## Why a Node proxy?

The SAPS status portal presents an incomplete TLS certificate chain, so
Node's fetch rejects it with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`. The proxy in
`server/saps.mjs` uses an undici dispatcher with `rejectUnauthorized: false`
for outbound scraping only (mirroring what `curl -k` / PHP's
`CURLOPT_SSL_VERIFYPEER=false` did).
