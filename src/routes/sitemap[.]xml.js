import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-url";

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]);

// /sitemap.xml for search engines: the public pages plus one entry per destination and per
// published circuit.
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request, context }) => {
        const base = siteUrl(request);
        const supabase = context.getSupabase();
        const [destinations, circuits] = await Promise.all([
          supabase.from("destinations").select("slug, updated_at").order("sort_order"),
          supabase.from("circuits").select("slug, updated_at").eq("published", true).order("sort_order"),
        ]);
        if (destinations.error || circuits.error) return new Response("Sitemap indisponible", { status: 503 });

        const page = (path, priority) => (item) => ({
          loc: `${base}/${path}/${item.slug}`,
          lastmod: item.updated_at?.slice(0, 10),
          priority,
        });
        const entries = [
          { loc: `${base}/`, priority: "1.0" },
          { loc: `${base}/destinations`, priority: "0.9" },
          { loc: `${base}/circuits`, priority: "0.9" },
          { loc: `${base}/explorer`, priority: "0.9" },
          { loc: `${base}/produits`, priority: "0.7" },
          { loc: `${base}/transfert-aeroport`, priority: "0.7" },
          { loc: `${base}/contact`, priority: "0.6" },
          ...destinations.data.map(page("destinations", "0.8")),
          ...circuits.data.map(page("circuits", "0.8")),
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
