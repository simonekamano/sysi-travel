// The site's public address for absolute links (sitemap, robots.txt): SITE_URL when set,
// otherwise the request's own host, with the scheme Nginx forwards (it talks plain HTTP to the app).
export function siteUrl(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  const url = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  return `${protocol}://${host}`;
}
