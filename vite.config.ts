import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";
// @ts-expect-error — .mjs shared server helper
import { handleHealthcheck, handleCheckStatus } from "./server/saps.mjs";

// Dev-only middleware that mirrors the production Node server so
// `npm run dev` works with zero extra processes and identical behaviour.
function sapsDevApi(): Plugin {
  return {
    name: "saps-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/healthcheck", (req, res) =>
        handleHealthcheck(req, res),
      );
      server.middlewares.use("/api/check-status", (req, res) =>
        handleCheckStatus(req, res),
      );
    },
  };
}

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
