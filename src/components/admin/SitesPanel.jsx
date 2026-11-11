import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteSite } from "@/lib/server-fns";
import SiteForm from "@/components/admin/SiteForm";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { CATEGORY_BY_KEY, EXPLORER_REGIONS } from "@/data/explorer";

export default function SitesPanel({ sites = [], destinations = [] }) {
  const router = useRouter();
  const [region, setRegion] = useState("basse");
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const shown = sites.filter((site) => site.region === region);

  const saved = () => {
    setEditing(null);
    router.invalidate();
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteSite({ data: { id: pending.id } });
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
        <div className="flex flex-wrap gap-2">
          {EXPLORER_REGIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setRegion(item.key)}
              className={`label-caps inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors ${
                region === item.key ? "border-petrol bg-petrol text-ivory" : "border-petrol/20 text-petrol/70 hover:border-gold"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.label} ({sites.filter((site) => site.region === item.key).length})
            </button>
          ))}
        </div>
        {editing === null ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-2.5 text-ivory transition-colors hover:bg-petrol-deep"
          >
            <Plus className="h-4 w-4" /> Ajouter un site
          </button>
        ) : null}
      </div>

      {editing !== null ? (
        <SiteForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? { region } : editing}
          destinations={destinations}
          onCancel={() => setEditing(null)}
          onSaved={saved}
        />
      ) : null}

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {shown.map((site) => (
          <li key={site.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="h-14 w-20 shrink-0 overflow-hidden bg-petrol/10">
              {site.image ? <img src={site.image} alt={site.name} className="h-full w-full object-cover" /> : null}
            </div>
            <div className="flex-1">
              <p className="label-caps flex flex-wrap items-center gap-2" style={{ color: CATEGORY_BY_KEY[site.category]?.color }}>
                {CATEGORY_BY_KEY[site.category]?.label}
                {site.approximate ? <span className="text-petrol/45">· position approximative</span> : null}
                {site.published ? null : (
                  <span className="inline-flex items-center gap-1 text-petrol/45">
                    <EyeOff className="h-3 w-3" /> masqué
                  </span>
                )}
              </p>
              <h3 className="text-[1rem] font-semibold text-petrol">{site.name}</h3>
              <p className="text-[0.85rem] text-petrol/60">
                {site.town} · {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(site)}
                className="label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </button>
              <button
                type="button"
                onClick={() => setPending(site)}
                className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                aria-label={`Supprimer ${site.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {shown.length === 0 ? <li className="p-6 text-[0.9rem] text-petrol/55">Aucun site dans cette région.</li> : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer ce site ?"
        description={pending ? `« ${pending.name} » disparaîtra de la carte. Cette action est définitive.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
