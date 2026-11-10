import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Compass } from "lucide-react";
import { EXPLORER_REGIONS } from "@/data/explorer";
import { GUINEE_PROJECTION, GUINEE_VIEWBOX, REGION_PATHS } from "@/data/geo/guinee-svg";

// A few landmarks lit up on the preview map (the full list is on /explorer).
const LANDMARKS = [
  { name: "Îles de Loos", latitude: 9.458, longitude: -13.835 },
  { name: "Voile de la Mariée", latitude: 10.058, longitude: -12.9 },
  { name: "Parc du Badiar", latitude: 12.422, longitude: -13.3 },
  { name: "Falaises de Doucki", latitude: 10.953, longitude: -12.6 },
  { name: "Dame de Mali", latitude: 12.055, longitude: -12.281 },
  { name: "Kankan", latitude: 10.392, longitude: -9.302 },
  { name: "Source du Niger", latitude: 9.08, longitude: -10.73 },
  { name: "Ziama", latitude: 8.43, longitude: -9.4 },
  { name: "Mont Nimba", latitude: 7.62, longitude: -8.42 },
];

const project = ({ latitude, longitude }) => {
  const { minX, maxY, k, scale } = GUINEE_PROJECTION;
  return [(longitude - minX) * k * scale, (maxY - latitude) * scale];
};

// Home page invitation to the interactive map: Guinea draws itself, region after region.
export default function ExplorerTeaser({ sitesCount = 0 }) {
  const root = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={root} className="overflow-hidden bg-petrol-deep py-14 text-ivory lg:py-20">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow flex items-center gap-2 text-gold">
            <Compass className="h-4 w-4" /> Carte interactive
          </p>
          <h2 className="mt-4 text-[clamp(1.9rem,3.6vw,3rem)] font-bold leading-[1.08] tracking-[-0.015em]">
            Explorez la Guinée, région par région
          </h2>
          <p className="mt-5 max-w-md text-[1rem] leading-relaxed text-ivory/75">
            De l'océan aux forêts du sud, survolez les quatre régions, ouvrez la fiche de chaque site
            et laissez-vous guider d'une étape à l'autre.
          </p>
          <dl className="mt-8 flex gap-10">
            <div>
              <dd className="font-display text-[2.4rem] font-bold leading-none text-gold">{sitesCount}</dd>
              <dt className="label-caps mt-2 text-ivory/60">sites à découvrir</dt>
            </div>
            <div>
              <dd className="font-display text-[2.4rem] font-bold leading-none text-gold">4</dd>
              <dt className="label-caps mt-2 text-ivory/60">régions</dt>
            </div>
          </dl>
          <Link
            to="/explorer"
            className="label-caps mt-9 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-4 text-petrol-deep transition-colors duration-300 hover:bg-ivory"
          >
            Ouvrir la carte <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Link to="/explorer" aria-label="Ouvrir la carte interactive" className={`teaser-map group block ${visible ? "is-visible" : ""}`}>
          <svg viewBox={GUINEE_VIEWBOX} className="h-auto w-full overflow-visible" role="img" aria-label="Carte des quatre régions de Guinée">
            {EXPLORER_REGIONS.map((region, index) => (
              <path
                key={region.key}
                d={REGION_PATHS[region.key]}
                className="teaser-map__region"
                style={{ "--region-color": region.color, "--region-delay": `${index * 260}ms` }}
              />
            ))}
            {LANDMARKS.map((place, index) => {
              const [x, y] = project(place);
              return (
                <g key={place.name} className="teaser-map__pin" style={{ "--pin-delay": `${1500 + index * 140}ms` }}>
                  <circle cx={x} cy={y} r="11" className="teaser-map__pulse" />
                  <circle cx={x} cy={y} r="5.5" className="teaser-map__dot" />
                </g>
              );
            })}
          </svg>
          <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2">
            {EXPLORER_REGIONS.map((region) => (
              <span key={region.key} className="inline-flex items-center gap-2 text-[0.85rem] text-ivory/70">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: region.color }} />
                {region.label}
              </span>
            ))}
          </div>
        </Link>
      </div>
    </section>
  );
}
