import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { STEPS } from "@/data/site";

export default function HowItWorks() {
  return (
    <section className="bg-petrol py-14 text-ivory lg:py-20">
      <div className="mx-auto max-w-site px-6">
        <Reveal>
          <SectionHeading
            tone="light"
            eyebrow="Comment ça marche"
            title="Trois étapes, zéro incertitude"
            text="Vous gardez la main sur votre voyage ; nous nous occupons de tout ce qui se passe entre votre envie de partir et votre retour à la maison."
          />
        </Reveal>

        <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step, index) => (
            <Reveal key={step.n} delay={index * 110}>
              <div className="relative">
                <div className="flex items-center gap-4">
                  <span className="font-display text-[1.05rem] tracking-[0.3em] text-gold">{step.n}</span>
                  <span className="h-px flex-1 bg-ivory/20" />
                </div>
                <h3 className="mt-5 text-[1.1rem] font-semibold text-ivory">{step.title}</h3>
                <p className="mt-3 text-[0.93rem] leading-relaxed text-ivory/65">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}