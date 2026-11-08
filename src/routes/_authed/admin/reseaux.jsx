import { createFileRoute } from "@tanstack/react-router";
import { listReseauxSociaux } from "@/lib/server-fns";
import ReseauxPanel from "@/components/admin/ReseauxPanel";

export const Route = createFileRoute("/_authed/admin/reseaux")({
  loader: () => listReseauxSociaux(),
  head: () => ({ meta: [{ title: "Réseaux sociaux — Administration SYSI TRAVEL" }] }),
  component: AdminReseauxPage,
});

function AdminReseauxPage() {
  const reseaux = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Réseaux sociaux</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Vos pages sur les réseaux
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Collez l'adresse de chaque page. Les réseaux remplis apparaissent dans le pied de page de
          tout le site et sur la page contact ; laissez une case vide pour masquer un réseau.
        </p>
      </div>
      <div className="max-w-2xl">
        <ReseauxPanel reseaux={reseaux} />
      </div>
    </div>
  );
}
