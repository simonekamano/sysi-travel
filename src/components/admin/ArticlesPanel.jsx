import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ExternalLink, EyeOff, Pencil, Plus, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteArticle } from "@/lib/server-fns";
import ArticleForm from "@/components/admin/ArticleForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { ARTICLE_CATEGORY_LABEL, SHOP_CATEGORIES, articleImages, formatPrice, thumbOf, variantsOf } from "@/lib/boutique";
import { cn } from "@/lib/utils";

export default function ArticlesPanel({ articles = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const nextSortOrder = articles.reduce((max, article) => Math.max(max, article.sort_order ?? 0), 0) + 1;
  const visible = filter ? articles.filter((article) => article.category === filter) : articles;

  const saved = () => {
    setEditing(null);
    router.invalidate();
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteArticle({ data: { id: pending.id } });
      setPending(null);
      router.invalidate();
    } catch {
      toast.error("Suppression impossible. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {editing === null ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors hover:bg-petrol-deep"
        >
          <Plus className="h-4 w-4" /> Ajouter un article
        </button>
      ) : (
        <ArticleForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          sortOrder={nextSortOrder}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      )}

      <div className="flex flex-wrap gap-2">
        {[{ key: "", label: "Tous" }, ...SHOP_CATEGORIES].map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => setFilter(category.key)}
            className={cn(
              "label-caps rounded-full border px-4 py-2 transition-colors",
              filter === category.key ? "border-petrol bg-petrol text-ivory" : "border-petrol/20 text-petrol/70 hover:border-gold",
            )}
          >
            {category.label} ({category.key ? articles.filter((article) => article.category === category.key).length : articles.length})
          </button>
        ))}
      </div>

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {visible.map((article) => {
          const image = articleImages(article)[0];
          const variants = variantsOf(article);
          return (
            <li key={article.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden bg-petrol/5">
                {image ? <img src={thumbOf(image)} alt="" className="h-full w-full object-cover" /> : <Shirt className="h-5 w-5 text-gold-deep" strokeWidth={1.5} />}
              </div>
              <div className="flex-1">
                <p className="label-caps flex flex-wrap items-center gap-2 text-gold-deep">
                  {ARTICLE_CATEGORY_LABEL[article.category]} · {formatPrice(article.price_cents)}
                  {article.published ? null : (
                    <span className="inline-flex items-center gap-1 text-petrol/45">
                      <EyeOff className="h-3 w-3" /> hors vente
                    </span>
                  )}
                </p>
                <h3 className="text-[1rem] font-semibold text-petrol">{article.name}</h3>
                <p className="text-[0.85rem] text-petrol/55">
                  {variants.length} variante{variants.length > 1 ? "s" : ""}
                  {article.sizes.length ? ` · ${article.sizes.join(", ")}` : ""}
                  {article.custom_made ? " · sur mesure" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {article.published ? (
                  <a
                    href={`/boutique/article/${article.slug}`}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Voir ${article.name} sur le site`}
                    className="inline-flex items-center border border-petrol/20 px-3 py-2 text-petrol/60 transition-colors hover:border-gold hover:text-petrol"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(article);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setPending(article)}
                  className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                  aria-label={`Supprimer ${article.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
        {visible.length === 0 ? <li className="p-6 text-[0.9rem] text-petrol/55">Aucun article ici pour l'instant.</li> : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cet article ?"
        description={
          pending
            ? `« ${pending.name} » sera retiré de la boutique. Les commandes déjà passées le gardent dans leur détail. Pour seulement l'arrêter à la vente, décochez plutôt « En vente ».`
            : ""
        }
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
