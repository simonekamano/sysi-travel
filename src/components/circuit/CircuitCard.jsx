import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock } from "lucide-react";
import { CIRCUIT_KINDS } from "@/data/site";

// A circuit in a list (home page section, /circuits page): photo, type, duration, price.
export default function CircuitCard({ circuit }) {
  return (
    <Link
      to="/circuits/$slug"
      params={{ slug: circuit.slug }}
      className="group flex h-full flex-col overflow-hidden border border-petrol/15 bg-ivory-soft transition-colors duration-300 hover:border-gold"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-petrol">
        {circuit.image ? (
          <img
            src={circuit.image}
            alt={circuit.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
          />
        ) : null}
        <span className="label-caps absolute left-4 top-4 rounded-full bg-gold px-3 py-1.5 text-[0.66rem] text-petrol-deep">
          {CIRCUIT_KINDS[circuit.kind]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-[0.82rem] text-petrol/60">
          {circuit.duration ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gold-deep" /> {circuit.duration}
            </span>
          ) : null}
          {circuit.dates ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-gold-deep" /> {circuit.dates}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-[1.25rem] font-bold leading-tight text-petrol">{circuit.title}</h3>
        {circuit.tagline ? <p className="mb-5 mt-2 text-[0.92rem] leading-relaxed text-petrol/65">{circuit.tagline}</p> : null}
        <div className="mt-auto border-t border-petrol/10 pt-4">
          {circuit.price ? <p className="font-display text-[1.05rem] font-bold leading-snug text-petrol">{circuit.price}</p> : null}
          <p className="label-caps mt-2 text-gold-deep transition-transform duration-300 group-hover:translate-x-1">
            Voir le programme →
          </p>
        </div>
      </div>
    </Link>
  );
}
