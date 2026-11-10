import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Check, Copy, Loader2, Mail, MessageCircle, RotateCcw, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCommande, renvoyerLienCommande, setCommandeStatut } from "@/lib/server-fns";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { DOWNLOAD_LIMIT, ORDER_STATUSES, formatPrice } from "@/lib/boutique";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "payee", label: "Payées" },
  { value: "annulee", label: "Annulées" },
];

const STATUT_STYLE = {
  en_attente: "bg-gold/20 text-gold-deep",
  payee: "bg-[#1a7f4b]/10 text-[#1a7f4b]",
  annulee: "bg-petrol/10 text-petrol/55",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Conakry" });
const dayFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Africa/Conakry" });

const whatsappOf = (phone) => {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : "";
};

const actionClass =
  "label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol disabled:pointer-events-none disabled:opacity-40";

export default function CommandesPanel({ commandes = [] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [working, setWorking] = useState("");
  const [paying, setPaying] = useState(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const visible = filter === "all" ? commandes : commandes.filter((item) => item.statut === filter);
  const countOf = (statut) => commandes.filter((item) => item.statut === statut).length;
  const linkOf = (commande) => `${window.location.origin}/telechargement/${commande.token}`;

  const sentToast = (commande, emailed) =>
    emailed
      ? toast.success(`Lien de téléchargement envoyé à ${commande.email}.`)
      : toast.warning("L'e-mail n'est pas parti : copiez le lien et envoyez-le à l'acheteur (WhatsApp, e-mail).");

  const changeStatut = async (commande, statut) => {
    setWorking(commande.id);
    try {
      const result = await setCommandeStatut({ data: { id: commande.id, statut } });
      if (statut === "payee") sentToast(commande, result.emailed);
      router.invalidate();
    } catch {
      toast.error("Mise à jour impossible. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setWorking("");
      setPaying(null);
    }
  };

  const resend = async (commande) => {
    setWorking(commande.id);
    try {
      const result = await renvoyerLienCommande({ data: { id: commande.id } });
      sentToast(commande, result.emailed);
      router.invalidate();
    } catch {
      toast.error("Envoi impossible. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setWorking("");
    }
  };

  const copyLink = async (commande) => {
    try {
      await navigator.clipboard.writeText(linkOf(commande));
      toast.success("Lien copié.");
    } catch {
      window.prompt("Copiez le lien de téléchargement :", linkOf(commande));
    }
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteCommande({ data: { id: pending.id } });
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
            className={cn(
              "label-caps rounded-full border px-4 py-2 transition-colors",
              filter === item.value ? "border-petrol bg-petrol text-ivory" : "border-petrol/20 text-petrol/70 hover:border-gold",
            )}
          >
            {item.label} ({item.value === "all" ? commandes.length : countOf(item.value)})
          </button>
        ))}
      </div>

      <ul className="space-y-4">
        {visible.map((commande) => {
          const whatsapp = whatsappOf(commande.telephone);
          const expired = commande.lien_expire_le && new Date(commande.lien_expire_le) <= new Date();
          const isWorking = working === commande.id;
          return (
            <li key={commande.id} className="border border-petrol/15 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-[1.1rem] font-bold text-petrol">{commande.reference}</span>
                    <span className={cn("label-caps rounded-full px-3 py-1 text-[0.68rem]", STATUT_STYLE[commande.statut])}>
                      {ORDER_STATUSES[commande.statut]}
                    </span>
                  </p>
                  <p className="mt-1 text-[0.85rem] text-petrol/55">{dateFormat.format(new Date(commande.created_at))}</p>
                </div>
                <p className="font-display text-[1.25rem] font-bold text-petrol">{formatPrice(commande.total_cents)}</p>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-[0.92rem]">
                  <p className="font-semibold text-petrol">{commande.nom}</p>
                  <a href={`mailto:${commande.email}`} className="flex items-center gap-2 text-petrol/70 hover:text-gold-deep">
                    <Mail className="h-4 w-4" /> {commande.email}
                  </a>
                  {commande.telephone ? (
                    whatsapp ? (
                      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-petrol/70 hover:text-[#1a9e4b]">
                        <MessageCircle className="h-4 w-4" /> {commande.telephone}
                      </a>
                    ) : (
                      <p className="text-petrol/70">{commande.telephone}</p>
                    )
                  ) : null}
                </div>
                <ul className="space-y-1 text-[0.9rem] text-petrol/75">
                  {commande.lignes.map((ligne, index) => (
                    <li key={index} className="flex justify-between gap-4">
                      <span>{ligne.title}</span>
                      <span className="whitespace-nowrap text-petrol/55">{formatPrice(ligne.price_cents)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {commande.statut === "payee" ? (
                <p className="mt-4 text-[0.85rem] text-petrol/60">
                  {expired
                    ? "Lien expiré : renvoyez-le pour le rouvrir 30 jours."
                    : `Lien valable jusqu'au ${dayFormat.format(new Date(commande.lien_expire_le))}`}
                  {` · ${commande.telechargements}/${DOWNLOAD_LIMIT} téléchargements`}
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-petrol/10 pt-4">
                {commande.statut === "en_attente" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setPaying(commande)}
                      disabled={isWorking}
                      className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-4 py-2 text-ivory transition-colors hover:bg-petrol-deep disabled:opacity-50"
                    >
                      {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Paiement reçu
                    </button>
                    <button type="button" onClick={() => changeStatut(commande, "annulee")} disabled={isWorking} className={actionClass}>
                      <X className="h-4 w-4" /> Annuler
                    </button>
                  </>
                ) : null}
                {commande.statut === "payee" ? (
                  <>
                    <button type="button" onClick={() => copyLink(commande)} className={actionClass}>
                      <Copy className="h-4 w-4" /> Copier le lien
                    </button>
                    <button type="button" onClick={() => resend(commande)} disabled={isWorking} className={actionClass}>
                      {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Renvoyer le lien
                    </button>
                  </>
                ) : null}
                {commande.statut === "annulee" ? (
                  <button type="button" onClick={() => changeStatut(commande, "en_attente")} disabled={isWorking} className={actionClass}>
                    <RotateCcw className="h-4 w-4" /> Remettre en attente
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPending(commande)}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-petrol/45 transition-colors hover:text-destructive"
                  aria-label={`Supprimer la commande ${commande.reference}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
        {visible.length === 0 ? (
          <li className="border border-petrol/15 bg-white p-6 text-[0.9rem] text-petrol/55">Aucune commande ici pour l'instant.</li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(paying)}
        title="Paiement reçu ?"
        description={
          paying
            ? `La commande ${paying.reference} passe en « Payée » et ${paying.nom} reçoit tout de suite son lien de téléchargement à ${paying.email}.`
            : ""
        }
        confirmLabel="Oui, envoyer le lien"
        tone="confirm"
        busy={working === paying?.id}
        onCancel={() => setPaying(null)}
        onConfirm={() => changeStatut(paying, "payee")}
      />

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cette commande ?"
        description={pending ? `La commande ${pending.reference} sera effacée, et son lien de téléchargement ne marchera plus.` : ""}
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
