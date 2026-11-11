import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import ItineraryMap from "@/components/map/ItineraryMap";
import { hasPosition } from "@/lib/coordinates";
import { cn } from "@/lib/utils";

/**
 * The day-by-day programme. When days have a GPS position, an itinerary map sits beside it
 * (above it on phones, and stays in view while scrolling): the day being read lights up on
 * the map, and clicking a day or a pin moves both.
 */
export default function CircuitProgramme({ programme }) {
  const days = useMemo(() => programme.map((item, index) => ({ ...item, day: index + 1 })), [programme]);
  const steps = useMemo(() => days.filter(hasPosition), [days]);
  const [active, setActive] = useState(null);
  const items = useRef([]);
  // Until this time, scrolling does not change the active day (a click is scrolling to its day).
  const followPausedUntil = useRef(0);
  const withMap = steps.length > 0;

  // The day crossing a line just below the middle of the screen becomes the active one: on
  // phones the map covers the top third, so that is where the reader's eyes are.
  useEffect(() => {
    if (!withMap) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < followPausedUntil.current) return;
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActive(Number(visible.target.dataset.day));
      },
      { rootMargin: "-58% 0px -40% 0px" },
    );
    items.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [withMap, days]);

  const select = (day) => {
    followPausedUntil.current = Date.now() + 1200;
    setActive(day);
    items.current[day - 1]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const timeline = (
    <ol>
      {days.map((item, index) => {
        const located = hasPosition(item);
        const isActive = withMap && active === item.day;
        return (
          <li
            key={`${item.day}-${item.title}`}
            ref={(element) => (items.current[index] = element)}
            data-day={item.day}
            className="relative flex gap-5 pb-10 last:pb-0"
          >
            {index < days.length - 1 ? (
              <span aria-hidden="true" className="absolute bottom-0 left-[1.35rem] top-12 w-px bg-gold/40" />
            ) : null}
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full transition-colors duration-300",
                isActive ? "bg-gold text-petrol-deep" : "bg-petrol text-ivory",
              )}
            >
              <span className={cn("text-[0.55rem] uppercase leading-none tracking-[0.12em]", isActive ? "text-petrol-deep" : "text-gold")}>
                Jour
              </span>
              <span className="font-display text-[1rem] font-bold leading-none">{item.day}</span>
            </span>
            <div className="min-w-0 flex-1 pt-1.5">
              <h3 className="text-[1.08rem] font-semibold leading-snug text-petrol">{item.title}</h3>
              {item.place ? (
                located ? (
                  <button
                    type="button"
                    onClick={() => select(item.day)}
                    className="label-caps mt-1.5 inline-flex items-center gap-1.5 text-gold-deep transition-colors hover:text-petrol"
                  >
                    <MapPin className="h-3.5 w-3.5" /> {item.place}
                  </button>
                ) : (
                  <p className="label-caps mt-1.5 inline-flex items-center gap-1.5 text-petrol/50">
                    <MapPin className="h-3.5 w-3.5" /> {item.place}
                  </p>
                )
              ) : null}
              {item.description ? (
                <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed text-petrol/70">{item.description}</p>
              ) : null}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.place || item.title}
                  loading="lazy"
                  className="mt-4 aspect-[16/9] w-full max-w-md rounded-2xl object-cover"
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );

  return (
    <section className="py-14 lg:py-20">
      <div className="mx-auto max-w-site px-6">
        <Reveal>
          <p className="eyebrow text-gold-deep">{withMap ? "L'itinéraire" : "Le programme"}</p>
          <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.3rem)] font-bold leading-tight tracking-[-0.015em] text-petrol">
            Le programme jour par jour
          </h2>
        </Reveal>

        {withMap ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
            <div className="sticky top-[5.5rem] z-10 h-[34svh] lg:top-28 lg:order-last lg:h-[calc(100svh-9rem)]">
              <ItineraryMap steps={steps} active={active} onSelect={select} className="h-full shadow-[0_30px_70px_-50px_rgba(18,61,67,0.7)]" />
            </div>
            <div>{timeline}</div>
          </div>
        ) : (
          <div className="mt-8 max-w-3xl">{timeline}</div>
        )}
      </div>
    </section>
  );
}
