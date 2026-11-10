import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { NotFound } from "@/components/NotFound";
import CircuitView from "@/components/circuit/CircuitView";
import { LEAFLET_CSS } from "@/components/map/GuineaMap";
import { getCircuitPage } from "@/lib/server-fns";

// Admins' preview of a circuit, draft or published. Under _authed (rendered in the browser,
// with the admin's session), so row level security lets the draft through.
export const Route = createFileRoute("/_authed/apercu/circuits/$slug")({
  loader: async ({ params }) => {
    const data = await getCircuitPage({ data: { slug: params.slug } });
    if (!data.circuit) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Aperçu : ${loaderData?.circuit?.title ?? "circuit"} — SYSI TRAVEL` },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: LEAFLET_CSS }],
  }),
  notFoundComponent: () => (
    <NotFound>
      Ce circuit n'existe pas, ou votre compte n'a pas les droits d'administration.{" "}
      <Link to="/admin/circuits" className="text-gold-deep underline underline-offset-4">
        Retour aux circuits
      </Link>
    </NotFound>
  ),
  component: CircuitPreview,
});

function CircuitPreview() {
  return <CircuitView {...Route.useLoaderData()} />;
}
