import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

// Content Security Policy of the pages. Scripts run only from the site itself or carry the
// page's nonce (a random value drawn for every page served), so a script injected into a page
// cannot run; data can only be sent to the site, its Supabase API, the map tiles and the visit
// statistics (SaasClair).
// Images and video files may come from any HTTPS host: the administration accepts their links.
function contentSecurityPolicy(nonce) {
  const supabase = originOf(import.meta.env.VITE_SUPABASE_URL);
  const realtime = supabase.replace(/^http/, "ws");
  const https = getRequestHeader("x-forwarded-proto") === "https";
  return [
    "default-src 'self'",
    // SaasClair: the visit statistics script (it sends its page views to the same host).
    `script-src 'self' 'nonce-${nonce}' https://saasclair.com`,
    // React and the maps set style attributes.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: https:",
    `connect-src 'self' ${supabase} ${realtime} https://tiles.openfreemap.org https://saasclair.com`,
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const originOf = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
};

// The nonce of the page, handed to the router (src/router.jsx), which puts it on every script
// it renders. On the server: drawn at random and announced in the page's CSP header. In the
// browser: read back from the page's scripts, for any script added after loading.
export const pageNonce = createIsomorphicFn()
  .server(() => {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    const nonce = btoa(String.fromCharCode(...bytes));
    setResponseHeader("content-security-policy", contentSecurityPolicy(nonce));
    return nonce;
  })
  .client(() => document.querySelector("script[nonce]")?.nonce || undefined);
