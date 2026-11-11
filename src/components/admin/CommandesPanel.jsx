import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Check, Copy, Loader2, Mail, MapPin, MessageCircle, PackageCheck, RotateCcw, Send, Trash2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCommande, renvoyerLienCommande, setCommandeLivraison, setCommandeStatut } from "@/lib/server-fns";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { DELIVERY_STATUSES, DOWNLOAD_LIMIT, ORDER_STATUSES, formatPrice } from "@/lib/boutique";
import { cn } from "@/lib/utils";

// « À expédier »: paid orders whose articles are not sent yet.
const toShip = (item) => item.statut === "payee" && ["a_preparer", "en_preparation"].includes(item.livraison);

const FILTERS = [
  { value: "all", label: "Toutes", test: () => true },
  { value: "en_attente", label: "En attente", test: (item) => item.statut === "en_attente" },
  { value: "a_expedier", label: "À expédier", test: toShip },
  { value: "payee", label: "Payées", test: (item) => item.statut === "payee" },
  { value: "annulee", label: "Annulées", test: (item) => item.statut === "annulee" },
];

const LIVRAISON_STYLE = {
  a_preparer: "bg-gold/20 text-gold-deep",
  en_preparation: "bg-[#2563eb]/10 text-[#1d4ed8]",
  expediee: "bg-[#7c3aed]/10 text-[#6d28d9]",
  livree: "bg-[#1a7f4b]/10 text-[#1a7f4b]",
};

// The next shipping step, offered first.
const NEXT_STEP = {
  a_preparer: { value: "en_preparation", label: "En préparation", icon: PackageCheck },
  en_preparation: { value: "expediee", label: "Expédiée", icon: Truck },
  expediee: { value: "livree", label: "Livrée", icon: Check },
};

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

  const testOf = (value) => FILTERS.find((item) => item.value === value)?.test ?? (() => true);
  const visible = commandes.filter(testOf(filter));
  const countOf = (value) => commandes.filter(testOf(value)).length;
  const linkOf = (commande) => `${window.location.origin}/telechargement/${commande.token}`;

  const sentToast = (commande, emailed) =>
    commande.lignes.length
      ? emailed
        ? toast.success(`Lien de téléchargement envoyé à ${commande.email}.`)
        : toast.warning("L'e-mail n'est pas parti : copiez le lien et envoyez-le à l'acheteur (WhatsApp, e-mail).")
      : emailed
        ? toast.success(`Paiement enregistré : ${commande.nom} est prévenu par e-mail.`)
        : toast.warning("Paiement enregistré, mais l'e-mail n'est pas parti : prévenez l'acheteur sur WhatsApp.");

  const changeLivraison = async (commande, livraison) => {
    setWorking(commande.id);
    try {
      const result = await setCommandeLivraison({ data: { id: commande.id, livraison } });
      if (livraison !== "a_preparer") {
        if (result.emailed) toast.success(`${DELIVERY_STATUSES[livraison]} : ${commande.nom} est prévenu par e-mail.`);
        else toast.warning("Étape enregistrée, mais l'e-mail n'est pas parti : prévenez l'acheteur sur WhatsApp.");
      }
      router.invalidate();
    } catch {
      toast.error("Mise à jour impossible. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setWorking("");
    }
  };

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
            {item.label} ({countOf(item.value)})
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
                    {commande.livraison && commande.livraison !== "sans" && commande.statut !== "annulee" ? (
                      <span className={cn("label-caps inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.68rem]", LIVRAISON_STYLE[commande.livraison])}>
                        <Truck className="h-3 w-3" /> {DELIVERY_STATUSES[commande.livraison]}
                      </span>
                    ) : null}
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
                  {(commande.articles ?? []).map((item, index) => (
                    <li key={`a${index}`} className="flex justify-between gap-4">
                      <span>
                        {[item.name, item.variante, item.taille].filter(Boolean).join(" · ")}
                        {item.quantite > 1 ? <strong className="text-petrol">{` × ${item.quantite}`}</strong> : null}
                      </span>
                      <span className="whitespace-nowrap text-petrol/55">{formatPrice(item.price_cents * item.quantite)}</span>
                    </li>
                  ))}
                  {commande.lignes.map((ligne, index) => (
                    <li key={index} className="flex justify-between gap-4">
                      <span>{ligne.title} (PDF)</span>
                      <span className="whitespace-nowrap text-petrol/55">{formatPrice(ligne.price_cents)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {commande.adresse || commande.message ? (
                <div className="mt-4 space-y-1.5 rounded-lg bg-ivory-soft px-4 py-3 text-[0.88rem] text-petrol/75">
                  {commande.adresse ? (
                    <p className="flex gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                      <span className="whitespace-pre-line">
                        {commande.adresse}
                        {commande.pays ? `\n${commande.pays}` : ""}
                      </span>
                    </p>
                  ) : null}
                  {commande.message ? <p className="whitespace-pre-line text-petrol/65">« {commande.message} »</p> : null}
                </div>
              ) : null}

              {commande.statut === "payee" && commande.lignes.length ? (
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
                {commande.statut === "payee" && NEXT_STEP[commande.livraison] ? (
                  <button
                    type="button"
                    onClick={() => changeLivraison(commande, NEXT_STEP[commande.livraison].value)}
                    disabled={isWorking}
                    className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-4 py-2 text-ivory transition-colors hover:bg-petrol-deep disabled:opacity-50"
                  >
                    {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : (() => {
                      const Icon = NEXT_STEP[commande.livraison].icon;
                      return <Icon className="h-4 w-4" />;
                    })()}
                    {NEXT_STEP[commande.livraison].label}
                  </button>
                ) : null}
                {commande.statut === "payee" && commande.lignes.length ? (
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
            ? paying.lignes.length
              ? `La commande ${paying.reference} passe en « Payée » et ${paying.nom} reçoit tout de suite son lien de téléchargement à ${paying.email}.`
              : `La commande ${paying.reference} passe en « Payée » et ${paying.nom} est prévenu par e-mail. Vous pourrez ensuite suivre l'expédition.`
            : ""
        }
        confirmLabel={paying?.lignes.length ? "Oui, envoyer le lien" : "Oui, paiement reçu"}
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
