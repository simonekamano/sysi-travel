import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { AlertTriangle, BookOpen, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLivre } from "@/lib/server-fns";
import { browserSupabase } from "@/lib/supabase";
import LivreForm from "@/components/admin/LivreForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { BOOK_KIND_LABEL, formatPrice, formatSize } from "@/lib/boutique";

export default function LivresPanel({ livres = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const nextSortOrder = livres.reduce((max, livre) => Math.max(max, livre.sort_order ?? 0), 0) + 1;

  const saved = () => {
    setEditing(null);
    router.invalidate();
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteLivre({ data: { id: pending.id } });
      if (pending.file_path) await browserSupabase().storage.from("livres").remove([pending.file_path]).catch(() => null);
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
          className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
        >
          <Plus className="h-4 w-4" /> Ajouter un livre ou un guide
        </button>
      ) : (
        <LivreForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          sortOrder={nextSortOrder}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      )}

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {livres.map((livre) => (
          <li key={livre.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden bg-petrol-deep shadow-sm">
              {livre.cover ? (
                <img src={livre.cover} alt="" className="h-full w-full object-cover" />
              ) : (
                <BookOpen className="h-5 w-5 text-gold" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1">
              <p className="label-caps flex flex-wrap items-center gap-2 text-gold-deep">
                {BOOK_KIND_LABEL[livre.kind]} · {formatPrice(livre.price_cents)}
                {livre.published ? null : (
                  <span className="inline-flex items-center gap-1 text-petrol/45">
                    <EyeOff className="h-3 w-3" /> hors vente
                  </span>
                )}
              </p>
              <h3 className="text-[1rem] font-semibold text-petrol">{livre.title}</h3>
              <p className="flex items-center gap-1.5 text-[0.85rem] text-petrol/55">
                {livre.file_path ? (
                  `PDF ${formatSize(livre.file_size)}`
                ) : (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-gold-deep" /> PDF manquant
                  </>
                )}
                {livre.author ? ` · ${livre.author}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(livre)}
                className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => setPending(livre)}
                className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                aria-label={`Supprimer ${livre.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {livres.length === 0 ? (
          <li className="p-6 text-[0.9rem] text-petrol/55">
            Aucun livre pour l'instant : la boutique affiche « Bientôt disponible » et la section de l'accueil reste masquée.
          </li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer ce livre ?"
        description={
          pending
            ? `« ${pending.title} » et son PDF seront effacés : les personnes qui l'ont acheté ne pourront plus le télécharger. Pour seulement l'arrêter à la vente, décochez plutôt « En vente ».`
            : ""
        }
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
