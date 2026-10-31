import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FormuleForm from "@/components/admin/FormuleForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function FormulesPanel({ formules = [] }) {
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
    await base44.entities.Formule.delete(pending.id);
    setBusy(false);
    setPending(null);
    router.invalidate();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[0.95rem] text-petrol/65">
          {formules.length} formule{formules.length > 1 ? "s" : ""} en ligne.
        </p>
        {editing === null ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors hover:bg-petrol-deep"
          >
            <Plus className="h-4 w-4" /> Ajouter une formule
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <FormuleForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      ) : null}

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {formules.map((formule) => (
          <li key={formule.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="h-16 w-24 shrink-0 overflow-hidden bg-petrol/10">
              {formule.image ? (
                <img
                  src={formule.image}
                  alt={formule.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="label-caps text-gold-deep">{formule.duration}</p>
              <h3 className="text-[1rem] font-medium text-petrol">
                {formule.name}
                {formule.highlight ? " · en avant" : ""}
              </h3>
            </div>
            <p className="font-display text-[1.4rem] leading-none text-petrol">{formule.price}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(formule)}
                className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => setPending(formule)}
                className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                aria-label={`Supprimer ${formule.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {formules.length === 0 ? (
          <li className="p-6 text-[0.9rem] text-petrol/55">
            Aucune formule pour le moment. Ajoutez la première.
          </li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cette formule ?"
        description={pending ? `« ${pending.name} » disparaîtra du site. Cette action est définitive.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}