import { createFileRoute } from "@tanstack/react-router";
import { listCommandes } from "@/lib/server-fns";
import CommandesPanel from "@/components/admin/CommandesPanel";

export const Route = createFileRoute("/_authed/admin/commandes")({
  loader: () => listCommandes(),
  head: () => ({ meta: [{ title: "Commandes — Administration SYSI TRAVEL" }] }),
  component: AdminCommandesPage,
});

function AdminCommandesPage() {
  const commandes = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Boutique</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Commandes
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Contactez l'acheteur pour le paiement (Orange Money, virement…), puis cliquez sur
          « Paiement reçu » : il reçoit aussitôt par e-mail son lien de téléchargement, valable 30 jours.
          Vous pouvez aussi copier ce lien pour l'envoyer sur WhatsApp.
        </p>
      </div>
      <CommandesPanel commandes={commandes} />
    </div>
  );
}
