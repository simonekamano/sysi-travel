// Production server: the built app (dist/) on Node, with srvx.
// Static files from dist/client first, everything else through the SSR handler.
//   npm run build && npm start      (PORT and HOST from the environment)
import { fileURLToPath } from "node:url";
import { serve } from "srvx";
import { serveStatic } from "srvx/static";
import app from "./dist/server/server.js";

const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

const assets = serveStatic({ dir: fileURLToPath(new URL("./dist/client", import.meta.url)) });

serve({
  port,
  hostname,
  middleware: [
    async (request, next) => {
      const response = await assets(request, next);
      // Hashed build assets never change: cache them for a year.
      if (response?.ok && new URL(request.url).pathname.startsWith("/assets/")) {
        response.headers.set("cache-control", "public, max-age=31536000, immutable");
      }
      return response;
    },
  ],
  fetch: (request) => app.fetch(request),
});
