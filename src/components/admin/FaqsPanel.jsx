import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteFaq } from "@/lib/server-fns";
import FaqForm from "@/components/admin/FaqForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function FaqsPanel({ faqs = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const saved = () => {
    setEditing(null);
    router.invalidate();
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteFaq({ data: { id: pending.id } });
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[0.95rem] text-petrol/65">
          {faqs.length} question{faqs.length > 1 ? "s" : ""} publiée{faqs.length > 1 ? "s" : ""}.
        </p>
        {editing === null ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors hover:bg-petrol-deep"
          >
            <Plus className="h-4 w-4" /> Ajouter une question
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <FaqForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      ) : null}

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {faqs.map((item) => (
          <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
            <div className="flex-1">
              <h3 className="text-[0.98rem] font-semibold text-petrol">{item.question}</h3>
              <p className="mt-1 line-clamp-2 text-[0.87rem] leading-relaxed text-petrol/60">
                {item.answer}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditing(item)}
                className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => setPending(item)}
                className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                aria-label="Supprimer la question"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {faqs.length === 0 ? (
          <li className="p-6 text-[0.9rem] text-petrol/55">
            Aucune question pour le moment. Ajoutez la première.
          </li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cette question ?"
        description={pending ? `« ${pending.question} » sera retirée de la FAQ du site. Cette action est définitive.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}