import { ArrowUpRight, BriefcaseBusiness, Check } from "lucide-react";
import Reveal from "@/components/landing/Reveal";

const BENEFITS = ["À votre rythme, en parallèle de votre activité", "Accompagnement personnel pour démarrer", "Présentation complète en français"];

const LINKS = [
  {
    id: "presentation",
    step: "Étape 1 · Découvrir",
    title: "Recommande et gagne",
    text: "Découvrez en quelques minutes comment fonctionne le programme voyage : le principe, les avantages et la façon de démarrer.",
    cta: "Voir la présentation",
    href: "https://mwrlife.online/presentation-en-francais/shineroom/",
  },
  {
    id: "ambassadeur",
    step: "Étape 2 · Rejoindre",
    title: "Pour devenir ambassadeur, contacte-moi",
    text: "Envie de rejoindre l'équipe et de développer votre activité voyage ? L'inscription se fait en quelques minutes.",
    cta: "Devenir ambassadeur",
    href: "https://www.mwrlife.com/shineroom/join",
    primary: true,
  },
];

export default function Partner() {
  return (
    <section id="ambassadeur" className="bg-background pb-14 lg:pb-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-petrol-deep px-5 py-10 text-ivory sm:px-10 lg:px-14 lg:py-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl"
            />

            <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div>
                <span className="label-caps inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-gold">
                  <BriefcaseBusiness className="h-4 w-4" />
                  Opportunité business
                </span>
                <h2 className="mt-6 text-[clamp(1.8rem,3.2vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.015em] text-ivory">
                  Et si le voyage devenait aussi votre business ?
                </h2>
                <p className="mt-5 max-w-md text-[0.98rem] leading-relaxed text-ivory/75">
                  Vous aimez voyager et en parler autour de vous ? Avec le programme MWR Life,
                  recommandez des offres de voyage, développez votre propre réseau et construisez
                  une activité complémentaire dans le tourisme.
                </p>
                <ul className="mt-7 space-y-3">
                  {BENEFITS.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-[0.95rem] text-ivory/85">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-5">
                {LINKS.map((item) => (
                  <a
                    key={item.id}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-2xl border border-ivory/15 bg-ivory/[0.06] p-5 transition-colors duration-300 hover:border-gold/70 hover:bg-ivory/[0.09] sm:p-8"
                  >
                    <p className="label-caps text-gold">{item.step}</p>
                    <h3 className="mt-4 text-[clamp(1.2rem,1.8vw,1.5rem)] font-bold leading-[1.15] tracking-[-0.015em] text-ivory">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[0.95rem] leading-relaxed text-ivory/70">{item.text}</p>
                    <span
                      className={`label-caps mt-6 inline-flex items-center gap-2 whitespace-nowrap transition-colors max-sm:!tracking-[0.1em] ${
                        item.primary
                          ? "justify-center rounded-full bg-gold px-5 py-3 text-petrol-deep group-hover:bg-ivory sm:self-start"
                          : "self-start text-ivory group-hover:text-gold"
                      }`}
                    >
                      {item.cta}
                      <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <p className="relative mt-10 border-t border-ivory/10 pt-6 text-[0.85rem] text-ivory/50">
              Programme proposé par notre partenaire MWR Life, distinct des séjours SYSI TRAVEL. Les
              liens s'ouvrent sur son site.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
