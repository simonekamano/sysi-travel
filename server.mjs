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
// no MIME sniffing, no window shared with other sites, and no camera, microphone, location,
// payment or tracking API for any page.
const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), interest-cohort=(), browsing-topics=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-site",
  "x-permitted-cross-domain-policies": "none",
  "origin-agent-cluster": "?1",
};
// Pages set their own policy with a per-page nonce (src/lib/security.js); every other response
// (files, server functions, errors) gets this one. It also governs the map's worker script
// (/assets/maplibre-gl-worker…), which fetches the tiles of « Explorer la Guinée ».
const DEFAULT_CSP =
  "default-src 'self'; script-src 'self'; connect-src 'self' https://tiles.openfreemap.org; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";

// Browsers ask for these by name; the brand symbol is declared in the page head.
const ICON_ALIASES = new Set(["/favicon.ico", "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"]);

const applyHeaders = (headers) => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  if (!headers.has("content-security-policy")) headers.set("content-security-policy", DEFAULT_CSP);
  headers.delete("x-powered-by");
};

const withSecurityHeaders = (response) => {
  try {
    applyHeaders(response.headers);
    return response;
  } catch {
    // Immutable headers (some fetch responses): copy the response once.
    const copy = new Response(response.body, response);
    applyHeaders(copy.headers);
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
