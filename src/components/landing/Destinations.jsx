import { Link } from "@tanstack/react-router";
import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
import GuineaMap from "@/components/map/GuineaMap";

export default function Destinations({ destinations = [] }) {
  return (
    <section id="destinations" className="bg-background py-14 lg:py-20">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Découvrir la Guinée"
            title="Destinations iconiques"
            text="Des îles de l'Atlantique aux hauts plateaux du Fouta, des cascades de Pita aux forêts classées du Nimba : voici quelques-uns des lieux qui font la Guinée. Chaque étape est accessible dans nos circuits, avec un guide local."
          />
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <Reveal key={destination.id || destination.name} delay={(index % 3) * 90}>
              <Link
                to="/destinations/$slug"
                params={{ slug: destination.slug }}
                aria-label={`Découvrir ${destination.name}`}
                className="group block"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-petrol">
                  <img
                    src={destination.image}
                    alt={`${destination.name}, ${destination.region}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-petrol-deep/92 via-petrol-deep/25 to-transparent transition-opacity duration-500 group-hover:from-petrol-deep/95" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="label-caps text-gold">{destination.region}</p>
                    <h3 className="mt-2 text-[1.2rem] font-bold text-ivory">
                      {destination.name}
                    </h3>
                    <p className="mt-2 text-[0.85rem] leading-relaxed text-ivory/75">
                      {destination.text}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(destination.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-ivory/25 px-3 py-1 text-[0.66rem] uppercase tracking-[0.18em] text-ivory/70"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 flex items-center justify-between border-t border-ivory/20 pt-3 text-[0.78rem] uppercase tracking-[0.16em] text-gold">
                      <span>{destination.price}</span>
                      <span className="text-ivory/80 transition-all duration-300 group-hover:translate-x-1 group-hover:text-gold">
                        Découvrir →
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow text-gold-deep">Sur la carte</p>
              <h3 className="mt-3 text-[clamp(1.4rem,2.4vw,2rem)] font-bold leading-tight tracking-[-0.015em] text-petrol">
                De l'Atlantique à la forêt
              </h3>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-petrol/70">
                Repérez chaque étape et imaginez votre circuit : cliquez sur un repère pour ouvrir
                la fiche de la destination.
              </p>
            </div>
            <GuineaMap points={destinations} className="aspect-[4/3] sm:aspect-[16/10]" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}