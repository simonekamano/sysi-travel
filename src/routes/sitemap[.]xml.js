import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-url";

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]);

// /sitemap.xml for search engines: the public pages plus one entry per destination.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const base = siteUrl(request);
        const { data, error } = await context.getSupabase().from("destinations").select("slug, updated_at").order("sort_order");
        if (error) return new Response("Sitemap indisponible", { status: 503 });

        const entries = [
          { loc: `${base}/`, priority: "1.0" },
          { loc: `${base}/contact`, priority: "0.6" },
          ...data.map((item) => ({
            loc: `${base}/destinations/${item.slug}`,
            lastmod: item.updated_at?.slice(0, 10),
            priority: "0.8",
          })),
        ];

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...entries.map(
            (entry) =>
              `  <url><loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ""}<priority>${entry.priority}</priority></url>`,
          ),
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
