import { Link } from "@tanstack/react-router";

// A destination in a list (home page section, /destinations page): photo, region, tags, price.
export default function DestinationCard({ destination }) {
  return (
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
          <h3 className="mt-2 text-[1.2rem] font-bold text-ivory">{destination.name}</h3>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-ivory/75">{destination.text}</p>
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
  );
}
