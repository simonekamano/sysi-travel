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

// Sent with every response. HTTPS only (Nginx redirects http), no framing by other sites,
// no MIME sniffing, and no camera, microphone or location for any page.
const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "content-security-policy": "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

// Browsers ask for these by name; the brand symbol is declared in the page head.
const ICON_ALIASES = new Set(["/favicon.ico", "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"]);

const withSecurityHeaders = (response) => {
  try {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
    return response;
  } catch {
    // Immutable headers (some fetch responses): copy the response once.
    const copy = new Response(response.body, response);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) copy.headers.set(name, value);
    return copy;
  }
};

serve({
  port,
  hostname,
  middleware: [
    async (request, next) => withSecurityHeaders(await next()),
    async (request, next) => {
      const { pathname } = new URL(request.url);
      if (ICON_ALIASES.has(pathname)) {
        return new Response(null, { status: 301, headers: { location: "/brand/sysi-travel-symbole.png" } });
      }
      const response = await assets(request, next);
      // Hashed build assets never change: cache them for a year.
      if (response?.ok && pathname.startsWith("/assets/")) {
        response.headers.set("cache-control", "public, max-age=31536000, immutable");
      }
      return response;
    },
  ],
  fetch: (request) => app.fetch(request),
});
