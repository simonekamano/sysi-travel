import { createFileRoute } from "@tanstack/react-router";
import { getHistoireAdmin } from "@/lib/server-fns";
import HistoireForm from "@/components/admin/HistoireForm";

export const Route = createFileRoute("/_authed/admin/notre-histoire")({
  loader: () => getHistoireAdmin(),
  head: () => ({ meta: [{ title: "Notre histoire — Administration SYSI TRAVEL" }] }),
  component: AdminHistoirePage,
});

function AdminHistoirePage() {
  const histoire = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Notre histoire</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Votre histoire et notre accompagnement
        </h1>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-petrol/70">
          Les textes et les photos de la page « Notre histoire », accessible depuis le menu du site.
          Tout ce que vous enregistrez ici est aussitôt en ligne.
        </p>
      </div>
      {histoire ? (
        <HistoireForm key={histoire.updated_at} histoire={histoire} />
      ) : (
        <p className="border border-petrol/15 bg-white p-6 text-petrol/70">
          La page n'est pas encore prête : elle apparaîtra ici après la prochaine mise à jour du site.
        </p>
      )}
    </div>
  );
}
