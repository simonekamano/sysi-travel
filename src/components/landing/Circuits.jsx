import { ArrowRight, Check, Clock } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";
import { FORMULES } from "@/data/site";

export default function Circuits({ onSelect }) {
  return (
    <section id="offre" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Circuits & excursions"
            title="Trois façons de découvrir la Guinée"
            text="Des séjours construits avec nos partenaires locaux : guide francophone, hébergements et transferts inclus. Prix indicatifs par personne, hors vols internationaux, à confirmer selon la saison et le nombre de voyageurs."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {FORMULES.map((formule, index) => (
            <Reveal key={formule.id} delay={index * 90} className="h-full">
              <article
                className={cn(
                  "group flex h-full flex-col overflow-hidden border bg-white transition-all duration-500",
                  formule.highlight
                    ? "border-petrol shadow-[0_40px_80px_-52px_rgba(18,61,67,0.6)]"
                    : "border-petrol/15 hover:border-gold"
                )}
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-petrol">
                  <img
                    src={formule.image}
                    alt={`${formule.name} — ${formule.duration}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-petrol-deep/70 via-petrol-deep/10 to-transparent" />
                  <span className="label-caps absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-petrol-deep/80 px-3 py-1.5 text-ivory backdrop-blur">
                    <Clock className="h-3.5 w-3.5 text-gold" strokeWidth={1.8} />
                    {formule.duration}
                  </span>
                  {formule.highlight ? (
                    <span className="label-caps absolute right-4 top-4 rounded-full bg-gold px-3 py-1.5 text-petrol-deep">
                      Le plus choisi
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col p-7">
                  <h3 className="text-[1.15rem] font-medium uppercase tracking-[0.12em] text-petrol">
                    {formule.name}
                  </h3>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-petrol/65">
                    {formule.description}
                  </p>

                  <div className="mt-6 border-t border-petrol/12 pt-5">
                    <p className="label-caps text-petrol/40">Prix indicatif</p>
                    <p className="mt-1.5 flex items-end gap-2 font-display text-[1.9rem] leading-none text-petrol">
                      {formule.price} €
                      <span className="pb-1 text-[0.7rem] uppercase tracking-[0.16em] text-petrol/50">
                        / personne
                      </span>
                    </p>
                  </div>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {formule.features.map((feature) => (
                      <li key={feature} className="flex gap-3 text-[0.88rem] leading-snug text-petrol/75">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={2} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => onSelect(formule.id)}
                    className={cn(
                      "label-caps mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 transition-all duration-300",
                      formule.highlight
                        ? "bg-gold text-petrol-deep hover:bg-petrol hover:text-ivory"
                        : "border border-petrol/25 text-petrol hover:border-petrol hover:bg-petrol hover:text-ivory"
                    )}
                  >
                    Demander ce circuit
                    <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-10 text-center text-[0.95rem] text-petrol/60">
            Dates, durée ou programme à ajuster :{" "}
            <a
              href="#contact"
              className="text-gold-deep underline decoration-gold/60 underline-offset-4 hover:decoration-gold-deep"
            >
              parlez-nous de votre projet
            </a>
            , nous construisons aussi des séjours sur mesure.
          </p>
        </Reveal>
      </div>
    </section>
  );
}