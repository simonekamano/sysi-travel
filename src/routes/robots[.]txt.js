import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-url";

// /robots.txt: everything public is indexable except the administration and auth pages.
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /login",
          "Disallow: /register",
          "Disallow: /forgot-password",
          "Disallow: /reset-password",
          "Disallow: /api/",
          "Disallow: /panier",
          "Disallow: /compte",
          "Disallow: /telechargement/",
          "",
          `Sitemap: ${siteUrl(request)}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400" } });
      },
    },
  },
});
