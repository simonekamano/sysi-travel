import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDestination } from "@/lib/server-fns";
import DestinationForm from "@/components/admin/DestinationForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

export default function DestinationsPanel({ destinations = [] }) {
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
      await deleteDestination({ data: { id: pending.id } });
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
          {destinations.length} destination{destinations.length > 1 ? "s" : ""} affichée
          {destinations.length > 1 ? "s" : ""} sur le site.
        </p>
        {editing === null ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors hover:bg-petrol-deep"
          >
            <Plus className="h-4 w-4" /> Ajouter une destination
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <DestinationForm
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      ) : null}

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {destinations.map((destination) => (
          <li key={destination.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="h-16 w-24 shrink-0 overflow-hidden bg-petrol/10">
              {destination.image ? (
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="label-caps text-gold-deep">{destination.region}</p>
              <h3 className="text-[1rem] font-semibold text-petrol">{destination.name}</h3>
              <p className="text-[0.85rem] text-petrol/60">{destination.price}</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/destinations/${destination.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="label-caps inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/60 transition-colors hover:text-gold-deep"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Voir
              </a>
              <button
                type="button"
                onClick={() => setEditing(destination)}
                className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => setPending(destination)}
                className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                aria-label={`Supprimer ${destination.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {destinations.length === 0 ? (
          <li className="p-6 text-[0.9rem] text-petrol/55">
            Aucune destination pour le moment. Ajoutez la première.
          </li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cette destination ?"
        description={pending ? `« ${pending.name} » disparaîtra du site. Cette action est définitive.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}