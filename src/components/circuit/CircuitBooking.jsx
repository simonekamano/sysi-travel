import { useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ChevronDown, CreditCard, Info, Loader2, Lock, Minus, Plus, Users } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { formatPrice } from "@/lib/boutique";
import { useLegalLinks } from "@/lib/legal";
import { reserverCircuit } from "@/lib/server-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

const inputClass = "border-petrol/25 bg-white text-petrol placeholder:text-petrol/45 focus-visible:ring-gold";
const MAX_TRAVELLERS = 30;

// The chosen day → « 14 décembre 2026 » (what the agency and the traveller read in the e-mails).
const frenchDate = (date) => format(date, "d MMMM yyyy", { locale: fr });

// The departure calendar: large days, in French, weeks from Monday. The browser's own date picker
// is too small to read on some screens, and its language follows the visitor's system.
const calendarClasses = {
  months: "flex flex-col",
  month: "space-y-3",
  caption: "relative flex items-center justify-center pt-1",
  caption_label: "text-[1rem] font-semibold capitalize text-petrol",
  nav: "flex items-center",
  nav_button:
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-petrol/20 text-petrol transition-colors hover:border-gold hover:bg-gold/15 disabled:pointer-events-none disabled:opacity-30",
  nav_button_previous: "absolute left-0",
  nav_button_next: "absolute right-0",
  table: "w-full border-collapse",
  head_row: "flex",
  head_cell: "w-10 text-[0.72rem] font-semibold uppercase tracking-wide text-petrol/55 sm:w-11",
  row: "mt-1 flex w-full",
  cell: "relative h-10 w-10 p-0 text-center sm:h-11 sm:w-11",
  day: "inline-flex h-10 w-10 items-center justify-center rounded-full text-[0.95rem] text-petrol transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:h-11 sm:w-11",
  day_selected: "!bg-petrol font-semibold !text-ivory hover:!bg-petrol",
  day_today: "font-semibold",
  day_outside: "text-petrol/30",
  day_disabled: "pointer-events-none text-petrol/25 line-through",
  day_hidden: "invisible",
};

// Booking and paying a circuit online (circuits.prix_en_ligne_cents set, Stripe connected): the
// traveller chooses a date and the number of travellers, then pays the whole price or the deposit
// on Stripe's page. `cancelled`: back from that page without paying.
export default function CircuitBooking({ circuit, cancelled = false }) {
  const legal = useLegalLinks();
  const hasCgv = legal.some((link) => link.slug === "conditions-generales-de-vente");
  const [form, setForm] = useState({ date: null, voyageurs: 2, nom: "", email: "", telephone: "", message: "", cgv: false, site_web: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const openedAt = useRef(Date.now());
  const set = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const travellers = (value) => setForm((prev) => ({ ...prev, voyageurs: Math.min(MAX_TRAVELLERS, Math.max(1, value)) }));

  const unit = circuit.prix_en_ligne_cents;
  const total = unit * form.voyageurs;
  const deposit = circuit.acompte_pourcent < 100;
  const now = Math.round((total * circuit.acompte_pourcent) / 100);
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const chooseDate = (date) => {
    setForm((prev) => ({ ...prev, date: date ?? null }));
    if (date) setCalendarOpen(false);
  };

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
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <button
                      id="reservation-date"
                      type="button"
                      className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-petrol/25 bg-white px-3 text-left text-[0.95rem] text-petrol focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    >
                      <span className={form.date ? "block truncate first-letter:uppercase" : "block truncate text-petrol/45"}>
                        {form.date ? format(form.date, "EEEE d MMMM yyyy", { locale: fr }) : "Choisir une date"}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-petrol/55" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" collisionPadding={12} className="w-auto rounded-2xl border-petrol/15 bg-white p-4 shadow-xl">
                    <Calendar
                      mode="single"
                      locale={fr}
                      weekStartsOn={1}
                      selected={form.date ?? undefined}
                      onSelect={chooseDate}
                      defaultMonth={form.date ?? tomorrow}
                      fromMonth={tomorrow}
                      disabled={{ before: tomorrow }}
                      showOutsideDays={false}
                      className="p-0"
                      classNames={calendarClasses}
                    />
                  </PopoverContent>
                </Popover>
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
