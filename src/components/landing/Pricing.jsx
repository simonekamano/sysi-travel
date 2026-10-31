import { Check } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";
import { FORMULES } from "@/data/site";

export default function Pricing({ onSelect }) {
  return (
    <section id="offre" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Nos formules"
            title="Choisissez votre expérience"
            text="Tarifs par personne, hors vols internationaux, base deux voyageurs. Chaque devis est confirmé par écrit après un échange avec un expert SYSI TRAVEL."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {FORMULES.map((formule, index) => (
            <Reveal key={formule.id} delay={index * 90} className="h-full">
              <div
                className={cn(
                  "flex h-full flex-col border p-8 transition-all duration-500",
                  formule.highlight
                    ? "border-petrol bg-petrol text-ivory shadow-[0_40px_80px_-50px_rgba(18,61,67,0.9)]"
                    : "border-petrol/15 bg-white text-petrol hover:border-gold"
                )}
              >
                <div className="relative -mx-8 -mt-8 mb-7 aspect-[16/9] overflow-hidden">
                  <img
                    src={formule.image}
                    alt={`Circuit ${formule.name}, Guinée`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>

                {formule.highlight ? (
                  <span className="label-caps mb-5 inline-flex w-fit rounded-full bg-gold px-3 py-1.5 text-petrol-deep">
                    Le plus choisi
                  </span>
                ) : (
                  <span className="label-caps mb-5 inline-flex w-fit text-gold-deep">
                    {formule.duration}
                  </span>
                )}

                <h3 className="text-[1.15rem] font-medium uppercase tracking-[0.12em]">{formule.name}</h3>
                <p
                  className={cn(
                    "mt-2 text-[0.9rem] leading-relaxed",
                    formule.highlight ? "text-ivory/70" : "text-petrol/60"
                  )}
                >
                  {formule.tagline}
                </p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="font-display text-[2.5rem] leading-none">{formule.price} €</span>
                  <span
                    className={cn(
                      "pb-1 text-[0.78rem]",
                      formule.highlight ? "text-ivory/55" : "text-petrol/55"
                    )}
                  >
                    / personne
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-[0.74rem] uppercase tracking-[0.18em]",
                    formule.highlight ? "text-ivory/50" : "text-petrol/45"
                  )}
                >
                  {formule.duration}
                </p>

                <ul className="mt-7 flex-1 space-y-3">
                  {formule.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-[0.9rem] leading-snug">
                      <Check
                        className={cn("mt-0.5 h-4 w-4 shrink-0", formule.highlight ? "text-gold" : "text-gold-deep")}
                        strokeWidth={2}
                      />
                      <span className={formule.highlight ? "text-ivory/85" : "text-petrol/75"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => onSelect(formule.id)}
                  className={cn(
                    "label-caps mt-8 w-full rounded-full px-6 py-3.5 transition-all duration-300",
                    formule.highlight
                      ? "bg-gold text-petrol-deep hover:bg-ivory"
                      : "border border-petrol/25 text-petrol hover:border-petrol hover:bg-petrol hover:text-ivory"
                  )}
                >
                  Demander cette formule
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-10 text-center text-[0.95rem] text-petrol/60">
            Familles, groupes ou séjour entièrement sur mesure :{" "}
            <a href="#contact" className="text-gold-deep underline decoration-gold/60 underline-offset-4 hover:decoration-gold-deep">
              parlez-nous de votre projet
            </a>
            , nous construisons l'itinéraire à partir de 3 500 €.
          </p>
        </Reveal>
      </div>
    </section>
  );
}