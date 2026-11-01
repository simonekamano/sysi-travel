import { ArrowRight, BriefcaseBusiness, Clock, LifeBuoy, MapPin, ShieldCheck } from "lucide-react";
import { HERO_BADGES, IMAGES } from "@/data/site";

const ICONS = [MapPin, Clock, ShieldCheck, LifeBuoy];

export default function Hero() {
  return (
    <section
      id="accueil"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-petrol-deep">
      
      {/* An <img>, not a CSS background: the browser fetches it first (fetchpriority), with the HTML. */}
      <img
        src={IMAGES.hero}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-20 h-full w-full animate-kenburns object-cover object-center" />

      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-petrol-deep/90 via-petrol/40 to-petrol-deep/95" />
      

      <div className="flex flex-1 items-center justify-center px-6 pb-10 pt-32 lg:pt-36">
        <div className="mx-auto max-w-[1100px] text-center">
          <p className="eyebrow animate-fade-in text-gold">Bienvenue chez vous.</p>

          <h1 className="mt-6 animate-fade-up text-[clamp(2rem,5vw,4.3rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ivory">
            La Guinée comme vous ne l'avez jamais vécue.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl animate-fade-up text-[1.02rem] leading-relaxed text-ivory/80 [animation-delay:120ms]">
            Découvrez les plus beaux sites touristiques de Guinée, explorez des circuits
            authentiques et organisez votre séjour grâce à des partenaires locaux, depuis une
            plateforme simple et moderne.
          </p>

          <div className="mt-10 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:240ms] sm:flex-row">
            <a
              href="#offre"
              className="label-caps inline-flex w-full items-center justify-center rounded-full bg-gold px-8 py-4 text-petrol-deep transition-all duration-300 hover:bg-ivory sm:w-auto">
              
              Découvrir nos séjours
            </a>
            <a
              href="#contact"
              className="label-caps inline-flex w-full items-center justify-center rounded-full border border-ivory/40 px-8 py-4 text-ivory transition-all duration-300 hover:border-gold hover:text-gold sm:w-auto">
              
              Parler à un expert
            </a>
          </div>

          {/* Secondary audience: the travel business opportunity, under the travel calls to action. */}
          <a
            href="#ambassadeur"
            className="group mt-8 flex w-full animate-fade-up items-center gap-3 rounded-full border border-gold/45 bg-petrol-deep/50 py-2 pl-2 pr-4 text-left sm:pr-5 backdrop-blur-sm transition-colors duration-300 [animation-delay:360ms] hover:border-gold hover:bg-petrol-deep/70 sm:inline-flex sm:w-auto">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-petrol-deep sm:h-11 sm:w-11">
              <BriefcaseBusiness className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="label-caps block text-[0.66rem] text-gold">Business voyage</span>
              <span className="mt-0.5 block text-[0.9rem] font-semibold leading-snug text-ivory [text-wrap:balance] sm:text-[0.98rem]">
                Recommande et gagne de l'argent
              </span>
            </span>
            <ArrowRight className="hidden h-4 w-4 shrink-0 text-gold transition-transform duration-300 group-hover:translate-x-0.5 min-[400px]:block" />
          </a>
        </div>
      </div>

      <div className="relative border-t border-ivory/15">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-6 gap-y-5 px-6 py-7 sm:grid-cols-4">
          {HERO_BADGES.map((badge, index) => {
            const Icon = ICONS[index];
            return (
              <div key={badge.label} className="flex items-center gap-3">
                <Icon className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                <span className="text-[0.78rem] leading-snug tracking-wide text-ivory/70">
                  {badge.label}
                </span>
              </div>);

          })}
        </div>
      </div>
    </section>);

}