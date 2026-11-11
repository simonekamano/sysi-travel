import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `vite build` emits dist/client (static assets) and dist/server/server.js (the SSR
// handler); server.mjs serves both with Node in production.

// One id per build, compiled into both the browser code and the server: open tabs compare
// theirs with the server's (/api/version) to notice a new deployment (src/lib/app-version.js).
// The build loads this file more than once (browser and server builds): the first load stores
// the id in the environment so every later one reuses it.
process.env.APP_VERSION ||= Date.now().toString(36);
const APP_VERSION = process.env.APP_VERSION;

export default defineConfig({
  define: { "import.meta.env.APP_VERSION": JSON.stringify(APP_VERSION) },
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
