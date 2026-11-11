import { createFileRoute } from "@tanstack/react-router";
import { listAllArticles } from "@/lib/server-fns";
import ArticlesPanel from "@/components/admin/ArticlesPanel";

export const Route = createFileRoute("/_authed/admin/articles")({
  loader: () => listAllArticles(),
  head: () => ({ meta: [{ title: "Articles — Administration SYSI TRAVEL" }] }),
  component: AdminArticlesPage,
});

function AdminArticlesPage() {
  const articles = Route.useLoaderData();

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-gold-deep">Boutique</p>
        <h1 className="mt-2 text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.02em]">Articles</h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-petrol/70">
          Vêtements, sacs et bijoux vendus dans la boutique. Chaque article a ses variantes (couleur, tissu) avec leurs photos, et
          ses tailles. Les prix se changent ici à tout moment ; les commandes déjà passées gardent leur prix.
        </p>
      </div>
      <ArticlesPanel articles={articles} />
    </div>
  );
}
