import { createFileRoute } from "@tanstack/react-router";
import { listAllLivres } from "@/lib/server-fns";
import LivresPanel from "@/components/admin/LivresPanel";

export const Route = createFileRoute("/_authed/admin/livres")({
  loader: () => listAllLivres(),
  head: () => ({ meta: [{ title: "Livres & guides — Administration SYSI TRAVEL" }] }),
  component: AdminLivresPage,
});

function AdminLivresPage() {
  const livres = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Boutique</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Livres & guides
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Les livres et guides vendus en PDF sur la page Boutique. Le PDF reste privé : chaque acheteur
          reçoit un lien personnel, une fois son paiement validé dans l'onglet Commandes.
        </p>
      </div>
      <LivresPanel livres={livres} />
    </div>
  );
}
