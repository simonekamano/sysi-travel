import { createFileRoute } from "@tanstack/react-router";
import { listFormules } from "@/lib/server-fns";
import FormulesPanel from "@/components/admin/FormulesPanel";

export const Route = createFileRoute("/_authed/admin/formules")({
  loader: () => listFormules(),
  head: () => ({ meta: [{ title: "Formules & prix — Administration SYSI TRAVEL" }] }),
  component: AdminFormulesPage,
});

function AdminFormulesPage() {
  const formules = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="script-accent text-gold-deep">Offre du site</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-medium uppercase leading-tight tracking-[0.05em]">
          Formules & prix
        </h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Modifiez le tarif, la durée, les prestations et la photo de chaque formule affichée dans
          la section « Notre offre ».
        </p>
      </div>
      <FormulesPanel formules={formules} />
    </div>
  );
}