# Backlog

A South African firearm application tracker + digital safe.

## Run locally

```bash
npm install
npm run dev
```

That single command starts two processes via `concurrently`:

- **web** — Vite dev server on http://localhost:3000 (TanStack Start frontend)
- **api** — Express SAPS proxy on http://localhost:3001 (`server/saps-proxy.ts`)

The frontend calls `/api/*`, which Vite proxies to the Express server, so there
are no CORS issues and no environment variables to configure.

If you need to run them separately:

```bash
npm run dev:web   # frontend only
npm run dev:api   # SAPS proxy only
```

## Project structure

```
src/                      TanStack Start frontend (routes, components, lib)
server/saps-proxy.ts      Express proxy that scrapes the SAPS portal
vite.config.ts            Dev proxy /api -> http://localhost:3001
```

Application and firearm data is stored in browser `localStorage` only —
nothing is sent anywhere except your own SAPS status checks.
