import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

const SAPS_URL = "https://www.saps.gov.za/services/firearm_status_enquiry.php";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Dev-only middleware that mirrors the production PHP endpoints
// (public/api/*.php) so `npm run dev` works with zero extra processes.
// In production the same URLs are served by the PHP files on cPanel.
function sapsDevApi(): Plugin {
  return {
    name: "saps-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/healthcheck", async (_req, res) => {
        try {
          const r = await fetch(SAPS_URL, { headers: { "User-Agent": UA } });
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ isUp: r.ok }));
        } catch {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ isUp: false }));
        }
      });

      server.middlewares.use("/api/check-status", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        let body: { fsref?: string; fserial?: string } = {};
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
        } catch {
          // ignore
        }
        const fsref = (body.fsref || "").trim();
        const fserial = (body.fserial || "").trim();
        res.setHeader("Content-Type", "application/json");
        if (!fsref || !fserial) {
          res.statusCode = 400;
          res.end(
            JSON.stringify({
              error: "Reference and Serial numbers are required",
            }),
          );
          return;
        }
        try {
          const getRes = await fetch(SAPS_URL, {
            headers: { "User-Agent": UA },
          });
          const setCookie = getRes.headers.get("set-cookie") || "";
          const cookies = setCookie
            .split(/,(?=[^ ]+=)/)
            .map((c) => c.split(";")[0].trim())
            .filter(Boolean)
            .join("; ");
          const html = await getRes.text();
          let csrf = "";
          const cookieMatch = cookies.match(/csrf_token=([^;]+)/);
          if (cookieMatch) csrf = cookieMatch[1];
          if (!csrf) {
            const m = html.match(/name="csrf_token"\s+value="([^"]+)"/i);
            if (m) csrf = m[1];
          }
          const params = new URLSearchParams({
            csrf_token: csrf,
            fsref,
            fserial,
          });
          const postRes = await fetch(SAPS_URL + "#result", {
            method: "POST",
            headers: {
              "User-Agent": UA,
              "Content-Type": "application/x-www-form-urlencoded",
              Cookie: cookies,
              Referer: SAPS_URL,
            },
            body: params.toString(),
          });
          const resHtml = await postRes.text();
          const tableMatch = resHtml.match(
            /<table[^>]*class="[^"]*table-bordered[^"]*"[\s\S]*?<\/table>/i,
          );
          if (!tableMatch) {
            res.statusCode = 404;
            res.end(
              JSON.stringify({
                error:
                  "No status found. Please check your Reference and Serial numbers.",
              }),
            );
            return;
          }
          const rowMatch = tableMatch[0].match(
            /<tr[^>]*class="[^"]*active[^"]*"[^>]*>([\s\S]*?)<\/tr>/i,
          );
          if (!rowMatch) {
            res.statusCode = 404;
            res.end(
              JSON.stringify({
                error:
                  "No status found. Please check your Reference and Serial numbers.",
              }),
            );
            return;
          }
          const cells = Array.from(
            rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi),
          ).map((m) =>
            m[1]
              .replace(/<[^>]+>/g, "")
              .replace(/&nbsp;/g, " ")
              .replace(/\s+/g, " ")
              .trim(),
          );
          res.end(
            JSON.stringify({
              applicationType: cells[0] || "",
              applicationNumber: cells[1] || "",
              calibre: cells[2] || "",
              make: cells[3] || "",
              serialNumber: cells[4] || "",
              statusDate: cells[5] || "",
              status: cells[6] || "",
              statusDescription: cells[7] || "",
              nextStep: cells[8] || "",
            }),
          );
        } catch {
          res.statusCode = 500;
          res.end(
            JSON.stringify({ error: "Failed to communicate with SAPS server." }),
          );
        }
      });
    },
  };
}

// Pure Vite SPA. `npm run build` outputs a static `dist/` (SPA + PHP API
// files from public/) that can be dropped straight into cPanel.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), sapsDevApi()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
