import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NotFound } from "@/components/NotFound";
import CircuitView from "@/components/circuit/CircuitView";
import { LEAFLET_CSS } from "@/components/map/GuineaMap";
import { CIRCUIT_KINDS, absoluteUrl } from "@/data/site";
import { getCircuitPage } from "@/lib/server-fns";
import { AGENCY_ID, breadcrumbLd, jsonLd, noindex, pageUrl, seo } from "@/lib/seo";

export const Route = createFileRoute("/circuits/$slug")({
  loader: async ({ params }) => {
    const data = await getCircuitPage({ data: { slug: params.slug } });
    // Drafts are previewed at /apercu/circuits/$slug, never at their public address.
    if (!data.circuit?.published) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const circuit = loaderData?.circuit;
    if (!circuit) return noindex("Circuit introuvable — SYSI TRAVEL");
    const description =
      circuit.tagline || `${CIRCUIT_KINDS[circuit.kind]} ${circuit.duration} en Guinée avec SYSI TRAVEL : programme jour par jour et prix.`;
    const path = `/circuits/${circuit.slug}`;
    return seo({
      title: `${circuit.title} — ${CIRCUIT_KINDS[circuit.kind]} en Guinée | SYSI TRAVEL`,
      description,
      path,
      image: circuit.image,
      imageAlt: circuit.title,
      type: "article",
      links: [
        { rel: "stylesheet", href: LEAFLET_CSS },
        ...(circuit.image ? [{ rel: "preload", as: "image", href: circuit.image, fetchPriority: "high" }] : []),
      ],
      scripts: [
        jsonLd({
          "@type": "TouristTrip",
          name: circuit.title,
          description,
          url: pageUrl(path),
          ...(circuit.image ? { image: absoluteUrl(circuit.image) } : {}),
          touristType: CIRCUIT_KINDS[circuit.kind],
          provider: { "@id": AGENCY_ID },
          ...(circuit.programme?.length
            ? {
                itinerary: {
                  "@type": "ItemList",
                  itemListElement: circuit.programme.map((day, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    item: { "@type": "TouristAttraction", name: day.place || day.title, description: day.title },
                  })),
                },
              }
            : {}),
        }),
        breadcrumbLd([["Accueil", "/"], ["Circuits et excursions", "/circuits"], [circuit.title, path]]),
      ],
    });
  },
  notFoundComponent: () => (
    <NotFound>
      Ce circuit n'existe pas ou n'est plus proposé.{" "}
      <Link to="/circuits" className="text-gold-deep underline underline-offset-4">
        Voir tous les circuits
      </Link>
    </NotFound>
  ),
  component: CircuitPage,
});

function CircuitPage() {
  return <CircuitView {...Route.useLoaderData()} />;
}
