import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteCircuit } from "@/lib/server-fns";
import CircuitForm from "@/components/admin/CircuitForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { CIRCUIT_KINDS } from "@/data/site";

export default function CircuitsPanel({ circuits = [] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const published = circuits.filter((item) => item.published).length;

  const saved = () => {
    setEditing(null);
    router.invalidate();
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteCircuit({ data: { id: pending.id } });
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
          {published} publié{published > 1 ? "s" : ""} sur {circuits.length} circuit{circuits.length > 1 ? "s" : ""}.
        </p>
        {editing === null ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors hover:bg-petrol-deep"
          >
            <Plus className="h-4 w-4" /> Ajouter un circuit
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <CircuitForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      ) : null}

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {circuits.map((circuit) => (
          <li key={circuit.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="h-16 w-24 shrink-0 overflow-hidden bg-petrol/10">
              {circuit.image ? <img src={circuit.image} alt={circuit.title} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex-1">
              <p className="label-caps flex flex-wrap items-center gap-2 text-gold-deep">
                {CIRCUIT_KINDS[circuit.kind]}
                {circuit.duration ? <span className="text-petrol/45">· {circuit.duration}</span> : null}
                <span
                  className={
                    circuit.published
                      ? "rounded-full bg-[#C6E7CE] px-2 py-0.5 text-[0.62rem] text-[#14532D]"
                      : "rounded-full bg-petrol/10 px-2 py-0.5 text-[0.62rem] text-petrol/60"
                  }
                >
                  {circuit.published ? "Publié" : "Brouillon"}
                </span>
              </p>
              <h3 className="text-[1rem] font-semibold text-petrol">{circuit.title}</h3>
              <p className="text-[0.85rem] text-petrol/60">
                {circuit.price || "Prix à définir"} · {circuit.programme?.length || 0} jour
                {(circuit.programme?.length || 0) > 1 ? "s" : ""} au programme
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={circuit.published ? `/circuits/${circuit.slug}` : `/apercu/circuits/${circuit.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="label-caps inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/60 transition-colors hover:text-gold-deep"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Voir
              </a>
              <button
                type="button"
                onClick={() => setEditing(circuit)}
                className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => setPending(circuit)}
                className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                aria-label={`Supprimer ${circuit.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {circuits.length === 0 ? (
          <li className="p-6 text-[0.9rem] text-petrol/55">
            Aucun circuit pour le moment. Ajoutez le premier : il restera en brouillon tant que la case
            « Publié sur le site » n'est pas cochée.
          </li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer ce circuit ?"
        description={pending ? `« ${pending.title} » et son programme disparaîtront du site. Cette action est définitive.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
