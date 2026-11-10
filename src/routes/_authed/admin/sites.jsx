import { createFileRoute } from "@tanstack/react-router";
import { listAllSites, listDestinations } from "@/lib/server-fns";
import SitesPanel from "@/components/admin/SitesPanel";

export const Route = createFileRoute("/_authed/admin/sites")({
  loader: async () => {
    const [sites, destinations] = await Promise.all([listAllSites(), listDestinations()]);
    return { sites, destinations };
  },
  head: () => ({ meta: [{ title: "Sites de la carte — Administration SYSI TRAVEL" }] }),
  component: AdminSitesPage,
});

function AdminSitesPage() {
  const { sites, destinations } = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Explorer la Guinée</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Sites de la carte
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Les sites affichés sur la carte interactive, par région. Corrigez une position, ajoutez une
          photo ou une description, ou masquez un site. Les positions de départ viennent des cartes
          touristiques fournies et sont à vérifier sur place.
        </p>
      </div>
      <SitesPanel sites={sites} destinations={destinations} />
    </div>
  );
}
