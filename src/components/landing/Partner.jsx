import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/landing/Reveal";

const LINKS = [
  {
    id: "presentation",
    kicker: "Présentation Travel",
    title: "Recommande et gagne",
    text: "Découvrez comment fonctionne le programme voyage, la présentation complète est disponible en français.",
    cta: "Voir la présentation",
    href: "https://mwrlife.online/presentation-en-francais/shineroom/",
  },
  {
    id: "ambassadeur",
    kicker: "Inscription MWR Life Ambassadeur",
    title: "Pour Devenir Ambassadeur, Contacte-moi",
    text: "Envie de rejoindre l'équipe et de développer votre activité voyage ? L'inscription se fait en quelques minutes.",
    cta: "Devenir ambassadeur",
    href: "https://www.mwrlife.com/shineroom/join",
  },
];

export default function Partner() {
  return (
    <section id="ambassadeur" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1180px] px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {LINKS.map((item, index) => (
            <Reveal key={item.id} delay={index * 90} className="h-full">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col justify-between border border-petrol/15 bg-ivory-soft p-8 transition-colors duration-300 hover:border-gold lg:p-10"
              >
                <div>
                  <p className="label-caps text-gold-deep">{item.kicker}</p>
                  <h3 className="mt-5 text-[clamp(1.25rem,2vw,1.7rem)] font-medium uppercase leading-[1.15] tracking-[0.05em] text-petrol">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-petrol/65">{item.text}</p>
                </div>
                <span className="label-caps mt-8 inline-flex items-center gap-2 text-petrol transition-colors group-hover:text-gold-deep">
                  {item.cta}
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}