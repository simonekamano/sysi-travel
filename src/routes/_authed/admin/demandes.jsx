import { createFileRoute } from "@tanstack/react-router";
import { listDemandes } from "@/lib/server-fns";
import DemandesPanel from "@/components/admin/DemandesPanel";

export const Route = createFileRoute("/_authed/admin/demandes")({
  loader: () => listDemandes(),
  head: () => ({ meta: [{ title: "Demandes de séjour — Administration SYSI TRAVEL" }] }),
  component: AdminDemandesPage,
});

function AdminDemandesPage() {
  const demandes = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Formulaire de contact</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Demandes de séjour
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Les demandes envoyées depuis le site, de la plus récente à la plus ancienne. Changez leur
          statut au fil du suivi.
        </p>
      </div>
      <DemandesPanel demandes={demandes} />
    </div>
  );
}
