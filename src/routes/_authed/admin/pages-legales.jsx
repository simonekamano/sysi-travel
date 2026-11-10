import { createFileRoute } from "@tanstack/react-router";
import { listLegalPages } from "@/lib/server-fns";
import LegalPagesPanel from "@/components/admin/LegalPagesPanel";

export const Route = createFileRoute("/_authed/admin/pages-legales")({
  loader: () => listLegalPages(),
  head: () => ({ meta: [{ title: "Pages légales — Administration SYSI TRAVEL" }] }),
  component: AdminLegalPage,
});

function AdminLegalPage() {
  const pages = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Pages légales</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          Mentions légales, conditions de vente et confidentialité
        </h1>
        <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-petrol/70">
          Relisez chaque texte et complétez les passages surlignés avec les informations de votre
          entreprise, puis publiez-le. Une page publiée est en ligne, avec son lien dans le pied de
          page du site ; une fois les conditions générales de vente publiées, l'acheteur doit les
          accepter pour commander. Un brouillon reste invisible des visiteurs.
        </p>
      </div>
      <LegalPagesPanel pages={pages} />
    </div>
  );
}
