import Reveal from "@/components/landing/Reveal";
import SectionHeading from "@/components/landing/SectionHeading";
export default function Destinations({ destinations = [] }) {
  return (
    <section id="destinations" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[1180px] px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Découvrir la Guinée"
            title="Destinations iconiques"
            text="Des îles de l'Atlantique aux hauts plateaux du Fouta, des cascades de Pita aux forêts classées du Nimba : voici quelques-uns des lieux qui font la Guinée. Chaque étape est accessible dans nos circuits, avec un guide local."
          />
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <Reveal key={destination.id || destination.name} delay={(index % 3) * 90}>
              <a href="#contact" className="group block">
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
                    <h3 className="mt-2 text-[1.2rem] font-medium uppercase tracking-[0.08em] text-ivory">
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
                    {destination.price ? (
                      <p className="mt-4 border-t border-ivory/20 pt-3 text-[0.78rem] uppercase tracking-[0.16em] text-gold">
                        {destination.price}
                      </p>
                    ) : null}
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}