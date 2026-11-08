import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NotFound } from "@/components/NotFound";
import CircuitView from "@/components/circuit/CircuitView";
import { CIRCUIT_KINDS, absoluteUrl } from "@/data/site";
import { getCircuitPage } from "@/lib/server-fns";

export const Route = createFileRoute("/circuits/$slug")({
  loader: async ({ params }) => {
    const data = await getCircuitPage({ data: { slug: params.slug } });
    // Drafts are previewed at /apercu/circuits/$slug, never at their public address.
    if (!data.circuit?.published) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const circuit = loaderData?.circuit;
    if (!circuit) return { meta: [{ title: "Circuit introuvable — SYSI TRAVEL" }] };
    const description =
      circuit.tagline || `${CIRCUIT_KINDS[circuit.kind]} ${circuit.duration} en Guinée avec SYSI TRAVEL : programme jour par jour et prix.`;
    return {
      meta: [
        { title: `${circuit.title} — ${CIRCUIT_KINDS[circuit.kind]} | SYSI TRAVEL Guinée` },
        { name: "description", content: description },
        { property: "og:title", content: `${circuit.title} — SYSI TRAVEL` },
        { property: "og:description", content: description },
        ...(circuit.image ? [{ property: "og:image", content: absoluteUrl(circuit.image) }] : []),
      ],
      links: circuit.image ? [{ rel: "preload", as: "image", href: circuit.image, fetchPriority: "high" }] : [],
    };
  },
  notFoundComponent: () => (
    <NotFound>
      Ce circuit n'existe pas ou n'est plus proposé.{" "}
      <Link to="/" hash="circuits" className="text-gold-deep underline underline-offset-4">
        Voir tous les circuits
      </Link>
    </NotFound>
  ),
  component: CircuitPage,
});

function CircuitPage() {
  return <CircuitView {...Route.useLoaderData()} />;
}
