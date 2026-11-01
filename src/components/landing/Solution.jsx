import { BadgeCheck, Clock, Compass, LifeBuoy } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { FEATURES, IMAGES } from "@/data/site";

const ICONS = { compass: Compass, badge: BadgeCheck, clock: Clock, headset: LifeBuoy };

export default function Solution() {
  return (
    <section id="solution" className="bg-ivory-soft py-14 lg:py-20">
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              align="left"
              eyebrow="La réponse SYSI TRAVEL"
              title="Une seule plateforme, pensée pour la diaspora"
              text="SYSI TRAVEL réunit les plus beaux sites de Guinée, des circuits conçus par des guides locaux et un accompagnement de bout en bout — depuis votre canapé à Paris, Montréal ou Bruxelles jusqu'à votre arrivée à Conakry."
            />
          </Reveal>

          <div className="mt-8 grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {FEATURES.map((feature, index) => {
              const Icon = ICONS[feature.icon];
              return (
                <Reveal key={feature.title} delay={index * 80}>
                  <div>
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-petrol/15 bg-white text-gold-deep">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <h3 className="mt-4 text-[1.02rem] font-semibold text-petrol">{feature.title}</h3>
                    <p className="mt-2 text-[0.92rem] leading-relaxed text-petrol/65">{feature.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>

        <Reveal delay={120}>
          <div className="relative mx-auto w-full max-w-[440px] lg:ml-auto">
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={IMAGES.textile}
                alt="Tissu artisanal guinéen et carnet de voyage"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="mt-6 bg-petrol p-6 text-ivory sm:absolute sm:-bottom-8 sm:-left-8 sm:mt-0 sm:max-w-[250px]">
              <p className="eyebrow text-gold">Un interlocuteur, pas une plateforme anonyme</p>
              <p className="mt-2 text-[0.84rem] leading-relaxed text-ivory/70">
                Notre équipe est basée en Guinée, joignable avant, pendant et après votre séjour.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}