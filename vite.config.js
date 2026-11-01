import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `vite build` emits dist/client (static assets) and dist/server/server.js (the SSR
// handler); server.mjs serves both with Node in production.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 3000 },
  plugins: [
    tanstackStart({
      srcDirectory: "src",
      // No CSRF middleware needed: server functions authenticate with a Bearer token that the
      // page's own script adds (src/lib/auth-middleware.js), never with cookies, so another
      // site cannot act as a signed-in user.
      serverFns: { disableCsrfMiddlewareWarning: true },
    }),
    react(),
  ],
});
