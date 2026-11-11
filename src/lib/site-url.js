import { SITE_ORIGIN } from "@/data/site";

// The site's public address for absolute links (sitemap, robots.txt): SITE_URL when set, the
// official address in production, otherwise (local development) the request's own host.
// Never the X-Forwarded-Host header: a visitor could send any value in it.
export function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  if (import.meta.env.PROD) return SITE_ORIGIN;
  return new URL(request.url).origin;
}
