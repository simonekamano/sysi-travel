import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { CalendarDays, Check, CreditCard, Loader2, Mail, MessageCircle, RotateCcw, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { deleteReservation, setReservationStatut } from "@/lib/server-fns";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { formatPrice } from "@/lib/boutique";
import { cn } from "@/lib/utils";

// Circuits booked and paid online (supabase/migrations/0017_paiement_stripe.sql). A booking is
// « en attente » while the traveller is on Stripe's page, « payée » once Stripe confirms it, and
// « annulée » when the payment page expires unpaid.
const STATUTS = {
  en_attente: "Paiement en cours",
  payee: "Payée",
  annulee: "Annulée",
};

const FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "payee", label: "Payées" },
  { value: "en_attente", label: "Paiement en cours" },
  { value: "annulee", label: "Annulées" },
];

const STATUT_STYLE = {
  en_attente: "bg-gold/20 text-gold-deep",
  payee: "bg-[#1a7f4b]/10 text-[#1a7f4b]",
  annulee: "bg-petrol/10 text-petrol/55",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Conakry" });

const whatsappOf = (phone) => {
  const digits = String(phone ?? "").replace(/[^\d]/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : "";
};

const actionClass =
  "label-caps inline-flex items-center gap-2 border border-petrol/20 px-3 py-2 text-petrol/75 transition-colors hover:border-gold hover:text-petrol disabled:pointer-events-none disabled:opacity-40";

export default function ReservationsPanel({ reservations = [] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [working, setWorking] = useState("");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);

  const visible = filter === "all" ? reservations : reservations.filter((item) => item.statut === filter);
  const countOf = (value) => (value === "all" ? reservations.length : reservations.filter((item) => item.statut === value).length);

  const changeStatut = async (reservation, statut) => {
    setWorking(reservation.id);
    try {
      await setReservationStatut({ data: { id: reservation.id, statut } });
      router.invalidate();
    } catch {
      toast.error("Mise à jour impossible. Vérifiez que vous êtes connecté en administrateur.");
    } finally {
      setWorking("");
    }
  };

  const remove = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await deleteReservation({ data: { id: pending.id } });
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
        {visible.map((reservation) => {
          const whatsapp = whatsappOf(reservation.telephone);
          const isWorking = working === reservation.id;
          const reste = reservation.total_cents - reservation.montant_en_ligne_cents;
          return (
            <li key={reservation.id} className="border border-petrol/15 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-[1.1rem] font-bold text-petrol">{reservation.reference}</span>
                    <span className={cn("label-caps rounded-full px-3 py-1 text-[0.68rem]", STATUT_STYLE[reservation.statut])}>
                      {STATUTS[reservation.statut]}
                    </span>
                  </p>
                  <p className="mt-1 text-[0.85rem] text-petrol/55">{dateFormat.format(new Date(reservation.created_at))}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-[1.25rem] font-bold text-petrol">{formatPrice(reservation.montant_en_ligne_cents)}</p>
                  <p className="text-[0.8rem] text-petrol/55">
                    {reste > 0 ? `payé en ligne · solde ${formatPrice(reste)} avant le départ` : "payé en ligne (prix total)"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 text-[0.92rem]">
                  <p className="font-semibold text-petrol">{reservation.nom}</p>
                  <a href={`mailto:${reservation.email}`} className="flex items-center gap-2 text-petrol/70 hover:text-gold-deep">
                    <Mail className="h-4 w-4" /> {reservation.email}
                  </a>
                  {whatsapp ? (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-petrol/70 hover:text-[#1a9e4b]">
                      <MessageCircle className="h-4 w-4" /> {reservation.telephone}
                    </a>
                  ) : (
                    <p className="text-petrol/70">{reservation.telephone}</p>
                  )}
                </div>
                <div className="space-y-1.5 text-[0.9rem] text-petrol/75">
                  <p className="font-semibold text-petrol">{reservation.circuit_title}</p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gold-deep" /> Départ souhaité : {reservation.date_souhaitee}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gold-deep" /> {reservation.voyageurs} voyageur{reservation.voyageurs > 1 ? "s" : ""} ×{" "}
                    {formatPrice(reservation.prix_unitaire_cents)} = {formatPrice(reservation.total_cents)}
                  </p>
                  {reservation.acompte_pourcent < 100 ? (
                    <p className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gold-deep" /> Acompte de {reservation.acompte_pourcent} %
                    </p>
                  ) : null}
                </div>
              </div>

              {reservation.message ? (
                <p className="mt-4 whitespace-pre-line rounded-lg bg-ivory-soft px-4 py-3 text-[0.88rem] text-petrol/65">« {reservation.message} »</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-petrol/10 pt-4">
                {reservation.statut === "en_attente" ? (
                  <>
                    <button type="button" onClick={() => changeStatut(reservation, "payee")} disabled={isWorking} className={actionClass}>
                      {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Marquer payée
                    </button>
                    <button type="button" onClick={() => changeStatut(reservation, "annulee")} disabled={isWorking} className={actionClass}>
                      <X className="h-4 w-4" /> Annuler
                    </button>
                  </>
                ) : null}
                {reservation.statut === "annulee" ? (
                  <button type="button" onClick={() => changeStatut(reservation, "en_attente")} disabled={isWorking} className={actionClass}>
                    <RotateCcw className="h-4 w-4" /> Remettre en attente
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPending(reservation)}
                  className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-petrol/45 transition-colors hover:text-destructive"
                  aria-label={`Supprimer la réservation ${reservation.reference}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
        {visible.length === 0 ? (
          <li className="border border-petrol/15 bg-white p-6 text-[0.9rem] text-petrol/55">Aucune réservation ici pour l'instant.</li>
        ) : null}
      </ul>

      <ConfirmDialog
        open={Boolean(pending)}
        title="Supprimer cette réservation ?"
        description={
          pending
            ? `La réservation ${pending.reference} sera effacée du site. Le paiement reste visible dans Stripe (un remboursement se fait depuis Stripe).`
            : ""
        }
        busy={busy}
        onCancel={() => setPending(null)}
        onConfirm={remove}
      />
    </div>
  );
}
