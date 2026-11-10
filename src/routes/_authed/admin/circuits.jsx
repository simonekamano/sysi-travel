import { createFileRoute } from "@tanstack/react-router";
import { listAllCircuits, listDestinations } from "@/lib/server-fns";
import CircuitsPanel from "@/components/admin/CircuitsPanel";

export const Route = createFileRoute("/_authed/admin/circuits")({
  // The destinations are suggested as places for the programme's steps, with their GPS position.
  loader: async () => {
    const [circuits, destinations] = await Promise.all([listAllCircuits(), listDestinations()]);
    return { circuits, destinations };
  },
  head: () => ({ meta: [{ title: "Circuits — Administration SYSI TRAVEL" }] }),
  component: AdminCircuitsPage,
});

function AdminCircuitsPage() {
  const { circuits, destinations } = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Offre de voyage</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Circuits et excursions
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Créez vos circuits, excursions et visites guidées : programme jour par jour, dates, prix et
          ce qui est inclus. Un circuit publié apparaît sur l'accueil et a sa propre page ; un
          brouillon reste visible des seuls administrateurs, via le bouton « Voir ».
        </p>
      </div>
      <CircuitsPanel circuits={circuits} destinations={destinations} />
    </div>
  );
}
