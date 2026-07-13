// Tiny zero-dependency Node server for production hosting (e.g. cPanel
// Node.js app / any Node 18+ host). Serves the built `dist/` SPA and the
// two /api/* endpoints. Run with:  node server/index.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleHealthcheck, handleCheckStatus } from "./saps.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  if (
    filePath.includes(`${path.sep}assets${path.sep}`) &&
    ext !== ".html"
  ) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (ext === ".html" || filePath.endsWith("manifest.webmanifest")) {
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
  }
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const p = url.pathname;

  // CORS preflight (defensive; same-origin in normal use)
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (p === "/api/healthcheck") return handleHealthcheck(req, res);
  if (p === "/api/check-status") return handleCheckStatus(req, res);

  // Static files from dist/
  const safe = path.normalize(p).replace(/^([/\\])+/, "");
  const candidate = path.join(DIST, safe);
  if (
    candidate.startsWith(DIST) &&
    fs.existsSync(candidate) &&
    fs.statSync(candidate).isFile()
  ) {
    return serveFile(res, candidate);
  }

  // SPA fallback
  const indexHtml = path.join(DIST, "index.html");
  if (fs.existsSync(indexHtml)) return serveFile(res, indexHtml);

  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Backlog server listening on http://localhost:${PORT}`);
});
