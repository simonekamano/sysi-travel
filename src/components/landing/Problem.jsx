import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import { PAINS } from "@/data/site";

export default function Problem() {
  return (
    <section id="constat" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Le constat"
            title="Rentrer au pays ne devrait pas être un casse-tête"
            text="Vous rêvez de faire découvrir la Guinée à vos enfants, de retrouver vos racines ou de vivre enfin les sites dont on vous parle depuis toujours. Mais entre les informations dispersées, les prix incertains et l'organisation à distance, le projet reste souvent dans un tiroir."
          />
        </Reveal>

        <div className="mt-16 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map((pain, index) => (
            <Reveal key={pain.n} delay={index * 90}>
              <div className="group border-t border-petrol/15 pt-6 transition-colors duration-500 hover:border-gold">
                <span className="font-display text-[0.7rem] tracking-[0.25em] text-gold-deep">
                  {pain.n}
                </span>
                <h3 className="mt-4 text-[1.06rem] font-medium text-petrol">{pain.title}</h3>
                <p className="mt-3 text-[0.93rem] leading-relaxed text-petrol/65">{pain.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mx-auto mt-16 max-w-2xl border-l-2 border-gold pl-6 font-script text-[1.4rem] italic leading-snug text-petrol/80">
            « La distance ne devrait jamais devenir une difficulté. »
          </p>
        </Reveal>
      </div>
    </section>
  );
}