import { createFileRoute } from "@tanstack/react-router";
import { getReglagesPaiement } from "@/lib/server-fns";
import PaiementPanel from "@/components/admin/PaiementPanel";

export const Route = createFileRoute("/_authed/admin/paiement")({
  loader: () => getReglagesPaiement(),
  head: () => ({ meta: [{ title: "Paiement en ligne — Administration SYSI TRAVEL" }] }),
  component: AdminPaiementPage,
});

function AdminPaiementPage() {
  const reglages = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Réglages</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Paiement en ligne
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Le paiement par carte passe par Stripe. Les prix se changent ici, dans l'administration :
          Stripe reçoit automatiquement le bon montant à chaque paiement.
        </p>
      </div>
      <PaiementPanel reglages={reglages} />
    </div>
  );
}
