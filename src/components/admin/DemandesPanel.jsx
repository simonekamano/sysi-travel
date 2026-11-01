import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDemande, updateDemandeStatut } from "@/lib/server-fns";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

const STATUTS = [
  { value: "nouveau", label: "Nouvelle" },
  { value: "en cours", label: "En cours" },
  { value: "traite", label: "Traitée" },
];

const FILTERS = [{ value: "all", label: "Toutes" }, ...STATUTS];

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Conakry",
});

export default function DemandesPanel({ demandes = [] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const visible = filter === "all" ? demandes : demandes.filter((item) => item.statut === filter);
  const countOf = (statut) => demandes.filter((item) => item.statut === statut).length;

  const changeStatut = async (demande, statut) => {
    try {
      await updateDemandeStatut({ data: { id: demande.id, statut } });
      router.invalidate();
    } catch {
      toast.error("Mise à jour impossible. Vérifiez que vous êtes connecté en administrateur.");
    }
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteDemande({ data: { id: pending.id } });
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
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`label-caps rounded-full border px-4 py-2 transition-colors ${
              filter === item.value
                ? "border-petrol bg-petrol text-ivory"
                : "border-petrol/20 text-petrol/70 hover:border-gold hover:text-petrol"
            }`}
          >
            {item.label} ({item.value === "all" ? demandes.length : countOf(item.value)})
          </button>
        ))}
      </div>

      <ul className="divide-y divide-petrol/10 border border-petrol/15 bg-white">
        {visible.map((demande) => (
          <li key={demande.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-[1rem] font-semibold text-petrol">{demande.nom}</h3>
                <p className="text-[0.8rem] text-petrol/50">{dateFormat.format(new Date(demande.created_at))}</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.88rem] text-petrol/75">
                <a href={`mailto:${demande.email}`} className="inline-flex items-center gap-1.5 hover:text-gold-deep">
                  <Mail className="h-3.5 w-3.5" /> {demande.email}
                </a>
                {demande.telephone ? (
                  <a href={`tel:${demande.telephone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1.5 hover:text-gold-deep">
                    <Phone className="h-3.5 w-3.5" /> {demande.telephone}
                  </a>
                ) : null}
              </div>
              <dl className="grid gap-x-6 gap-y-1 text-[0.85rem] sm:grid-cols-2">
                {[
                  ["Pays", demande.pays],
                  ["Destination", demande.destination],
                  ["Formule", demande.formule],
                  ["Période", demande.periode],
                  ["Voyageurs", demande.voyageurs],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="text-petrol/50">{label} :</dt>
                      <dd className="text-petrol">{value}</dd>
                    </div>
                  ))}
              </dl>
              {demande.message ? (
                <p className="whitespace-pre-line border-l-2 border-gold/50 pl-3 text-[0.88rem] leading-relaxed text-petrol/70">
                  {demande.message}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <select
                value={demande.statut}
                onChange={(event) => changeStatut(demande, event.target.value)}
                aria-label={`Statut de la demande de ${demande.nom}`}
                className="label-caps border border-petrol/20 bg-white px-3 py-2 text-petrol/80"
              >
                {STATUTS.map((statut) => (
                  <option key={statut.value} value={statut.value}>
                    {statut.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setPending(demande)}
                className="inline-flex items-center gap-2 border border-transparent px-3 py-2 text-petrol/50 transition-colors hover:text-destructive"
                aria-label={`Supprimer la demande de ${demande.nom}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
        {visible.length === 0 ? (
          <li className="p-6 text-[0.9rem] text-petrol/55">Aucune demande dans cette catégorie.</li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cette demande ?"
        description={pending ? `La demande de « ${pending.nom} » sera effacée. Cette action est définitive.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
