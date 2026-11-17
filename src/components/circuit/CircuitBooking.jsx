import { useRef, useState } from "react";
import { CalendarDays, CreditCard, Info, Loader2, Lock, Minus, Plus, Users } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { formatPrice } from "@/lib/boutique";
import { useLegalLinks } from "@/lib/legal";
import { reserverCircuit } from "@/lib/server-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const inputClass = "border-petrol/25 bg-white text-petrol placeholder:text-petrol/45 focus-visible:ring-gold";
const MAX_TRAVELLERS = 30;

// « 2026-12-14 » → « 14 décembre 2026 » (what the agency and the traveller read in the e-mails).
const frenchDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// Booking and paying a circuit online (circuits.prix_en_ligne_cents set, Stripe connected): the
// traveller chooses a date and the number of travellers, then pays the whole price or the deposit
// on Stripe's page. `cancelled`: back from that page without paying.
export default function CircuitBooking({ circuit, cancelled = false }) {
  const legal = useLegalLinks();
  const hasCgv = legal.some((link) => link.slug === "conditions-generales-de-vente");
  const [form, setForm] = useState({ date: "", voyageurs: 2, nom: "", email: "", telephone: "", message: "", cgv: false, site_web: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const openedAt = useRef(Date.now());
  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const travellers = (value) => setForm((prev) => ({ ...prev, voyageurs: Math.min(MAX_TRAVELLERS, Math.max(1, value)) }));

  const unit = circuit.prix_en_ligne_cents;
  const total = unit * form.voyageurs;
  const deposit = circuit.acompte_pourcent < 100;
  const now = Math.round((total * circuit.acompte_pourcent) / 100);
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.date) return setError("Choisissez votre date de départ souhaitée.");
    if (!form.nom.trim() || !form.email.trim() || form.telephone.trim().length < 6) {
      return setError("Votre nom, votre e-mail et votre téléphone sont nécessaires pour organiser le voyage.");
    }
    if (hasCgv && !form.cgv) return setError("Cochez la case pour accepter les conditions générales de vente.");
    setSending(true);
    setError("");
    try {
      const { paymentUrl } = await reserverCircuit({
        data: {
          circuit_id: circuit.id,
          date_souhaitee: frenchDate(form.date),
          voyageurs: form.voyageurs,
          nom: form.nom.trim(),
          email: form.email.trim(),
          telephone: form.telephone.trim(),
          message: form.message.trim(),
          cgv: form.cgv,
          site_web: form.site_web,
          delai: Date.now() - openedAt.current,
        },
      });
      window.location.assign(paymentUrl);
    } catch (caught) {
      setError(caught?.message || "La réservation n'a pas pu être envoyée. Réessayez ou écrivez-nous sur WhatsApp.");
      setSending(false);
    }
  };

  return (
    <section id="reserver" className="scroll-mt-24 bg-ivory-soft py-8 lg:py-10">
      <div className="mx-auto grid max-w-site gap-8 px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
        <Reveal>
          <p className="eyebrow text-gold-deep">Réservation en ligne</p>
          <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-tight tracking-[-0.015em] text-petrol">
            Réserver « {circuit.title} »
          </h2>
          <p className="mt-4 text-[1rem] leading-relaxed text-petrol/70">
            Choisissez votre date et le nombre de voyageurs, puis payez en ligne en toute sécurité. Nous vous contactons sous 72 heures pour
            confirmer la date et organiser votre voyage.
          </p>
          {cancelled ? (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-gold/15 px-4 py-3 text-[0.92rem] leading-relaxed text-petrol">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" /> Paiement annulé : rien n'a été débité. Vous pouvez réessayer quand
              vous voulez.
            </p>
          ) : null}
          <dl className="mt-6 space-y-3 rounded-2xl border border-petrol/15 bg-white p-5 text-[0.95rem]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-petrol/65">Prix par personne</dt>
              <dd className="font-semibold text-petrol">{formatPrice(unit)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-petrol/65">
                {form.voyageurs} voyageur{form.voyageurs > 1 ? "s" : ""}
              </dt>
              <dd className="font-semibold text-petrol">{formatPrice(total)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-petrol/10 pt-3">
              <dt className="font-semibold text-petrol">{deposit ? `À payer maintenant (acompte de ${circuit.acompte_pourcent} %)` : "À payer maintenant"}</dt>
              <dd className="font-display text-[1.5rem] font-extrabold text-petrol">{formatPrice(now)}</dd>
            </div>
            {deposit ? <p className="text-[0.85rem] text-petrol/60">Le solde ({formatPrice(total - now)}) se règle avant le départ.</p> : null}
          </dl>
        </Reveal>

        <Reveal delay={100}>
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-petrol/15 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reservation-date" className="label-caps flex items-center gap-1.5 text-petrol/65">
                  <CalendarDays className="h-3.5 w-3.5" /> Date de départ
                </Label>
                <Input id="reservation-date" type="date" min={tomorrow} value={form.date} onChange={set("date")} className={inputClass} required />
                {circuit.dates ? <p className="text-[0.8rem] text-petrol/55">{circuit.dates}</p> : null}
              </div>
              <div className="space-y-2">
                <Label className="label-caps flex items-center gap-1.5 text-petrol/65">
                  <Users className="h-3.5 w-3.5" /> Voyageurs
                </Label>
                <div className="flex h-10 w-fit items-center rounded-full border border-petrol/25 bg-white">
                  <button type="button" onClick={() => travellers(form.voyageurs - 1)} aria-label="Un voyageur de moins" className="flex h-10 w-10 items-center justify-center text-petrol/70 hover:text-petrol">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span aria-live="polite" className="w-8 text-center font-semibold text-petrol">
                    {form.voyageurs}
                  </span>
                  <button type="button" onClick={() => travellers(form.voyageurs + 1)} aria-label="Un voyageur de plus" className="flex h-10 w-10 items-center justify-center text-petrol/70 hover:text-petrol">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="reservation-nom" className="label-caps text-petrol/65">
                  Nom et prénom
                </Label>
                <Input id="reservation-nom" autoComplete="name" value={form.nom} onChange={set("nom")} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reservation-telephone" className="label-caps text-petrol/65">
                  Téléphone ou WhatsApp
                </Label>
                <Input id="reservation-telephone" type="tel" autoComplete="tel" value={form.telephone} onChange={set("telephone")} className={inputClass} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-email" className="label-caps text-petrol/65">
                E-mail
              </Label>
              <Input id="reservation-email" type="email" autoComplete="email" value={form.email} onChange={set("email")} className={inputClass} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-message" className="label-caps text-petrol/65">
                Précisions (facultatif)
              </Label>
              <Textarea
                id="reservation-message"
                rows={2}
                placeholder="Âge des enfants, besoins particuliers, lieu de prise en charge…"
                value={form.message}
                onChange={set("message")}
                className={`${inputClass} resize-none`}
              />
            </div>
            {/* Spam trap: hidden from people, filled in by robots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="reservation-site">Site web</label>
              <input id="reservation-site" tabIndex={-1} autoComplete="off" value={form.site_web} onChange={set("site_web")} />
            </div>
            {hasCgv ? (
              <label className="flex items-start gap-3 text-[0.85rem] leading-relaxed text-petrol/70">
                <input type="checkbox" checked={form.cgv} onChange={set("cgv")} className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--petrol))]" />
                <span>
                  J'ai lu et j'accepte les{" "}
                  <a href="/conditions-generales-de-vente" target="_blank" rel="noopener" className="text-gold-deep underline underline-offset-4">
                    conditions générales de vente
                  </a>
                  .
                </span>
              </label>
            ) : null}
            {error ? <p className="text-[0.85rem] font-semibold text-destructive">{error}</p> : null}
            <button
              type="submit"
              disabled={sending}
              className="label-caps flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-petrol-deep transition-all duration-300 hover:-translate-y-0.5 hover:bg-petrol hover:text-ivory disabled:pointer-events-none disabled:opacity-60"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Payer {formatPrice(now)}
            </button>
            <p className="flex items-start gap-2 text-[0.82rem] leading-relaxed text-petrol/55">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              Paiement sécurisé par carte bancaire sur la page de notre partenaire Stripe : vos coordonnées bancaires ne passent jamais par
              notre site.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
