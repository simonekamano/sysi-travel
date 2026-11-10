import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight, Compass, MapPin, Pause, Play, X } from "lucide-react";
import ExplorerMap from "@/components/explorer/ExplorerMap";
import { CATEGORY_BY_KEY, EXPLORER_REGIONS, REGION_BY_KEY, SITE_CATEGORIES } from "@/data/explorer";
import { cn } from "@/lib/utils";

// Time on each site during the guided tour (the camera flight takes about 2.4 s of it).
const TOUR_STEP_MS = 6000;

// Numbers that count up when they appear or change.
function CountUp({ value }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame = 0;
    const from = 0;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / 1200);
      setShown(Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span className="tabular-nums">{shown}</span>;
}

// Visiting order for the tour: from the westernmost site, always to the nearest one left.
function tourOrder(sites) {
  if (sites.length < 2) return sites;
  const left = [...sites];
  left.sort((a, b) => a.longitude - b.longitude);
  const order = [left.shift()];
  while (left.length) {
    const last = order[order.length - 1];
    let best = 0;
    left.forEach((site, i) => {
      const d = (site.latitude - last.latitude) ** 2 + (site.longitude - last.longitude) ** 2;
      const bestSite = left[best];
      if (d < (bestSite.latitude - last.latitude) ** 2 + (bestSite.longitude - last.longitude) ** 2) best = i;
    });
    order.push(left.splice(best, 1)[0]);
  }
  return order;
}

// Room the panels take over the map, so the camera centres sites in the free part.
const panelPadding = () =>
  typeof window === "undefined"
    ? { top: 130, right: 0, bottom: 0, left: 0 }
    : window.innerWidth >= 1024
      ? { top: 140, right: 20, bottom: 20, left: 420 }
      : { top: 150, right: 0, bottom: Math.round(window.innerHeight * 0.46), left: 0 };

function usePanelPadding() {
  // Computed at once in the browser (the map is client only), so its first view is right.
  const [padding, setPadding] = useState(panelPadding);
  useEffect(() => {
    const update = () => setPadding(panelPadding());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return padding;
}

/**
 * The interactive map of Guinea's regions and tourist sites. `onRequestTrip(destinationName)`:
 * the visitor asked for a trip from a site's card (the page scrolls to its form).
 */
export default function Explorer({ sites, destinations, onRequestTrip }) {
  const [region, setRegion] = useState(null);
  const [categories, setCategories] = useState(() => new Set(SITE_CATEGORIES.map((c) => c.key)));
  const [selected, setSelected] = useState(null);
  const [touring, setTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(-1);
  const padding = usePanelPadding();
  const panel = useRef(null);

  const inRegion = useMemo(() => (region ? sites.filter((site) => site.region === region) : sites), [sites, region]);
  const shown = useMemo(() => inRegion.filter((site) => categories.has(site.category)), [inRegion, categories]);
  const visible = useMemo(() => new Set(shown.map((site) => site.slug)), [shown]);
  const tour = useMemo(() => tourOrder(shown), [shown]);
  const site = sites.find((item) => item.slug === selected) ?? null;
  const destination = site?.destination_slug ? destinations.find((item) => item.slug === site.destination_slug) : null;
  const trail = useMemo(
    () => (tourIndex >= 0 ? tour.slice(0, tourIndex + 1).map((item) => [item.longitude, item.latitude]) : []),
    [tour, tourIndex],
  );

  const stopTour = () => {
    setTouring(false);
    setTourIndex(-1);
  };

  const chooseRegion = (key) => {
    stopTour();
    setSelected(null);
    setRegion(key);
    panel.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCategory = (key) => {
    stopTour();
    setCategories((previous) => {
      const next = new Set(previous);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const select = (slug) => {
    if (touring) setTouring(false);
    setSelected(slug);
    if (slug) panel.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Guided tour: one site after the other, the path drawn behind.
  useEffect(() => {
    if (!touring) return undefined;
    if (tourIndex >= tour.length - 1) {
      const end = setTimeout(() => setTouring(false), TOUR_STEP_MS);
      return () => clearTimeout(end);
    }
    const next = setTimeout(() => setTourIndex((i) => i + 1), tourIndex < 0 ? 0 : TOUR_STEP_MS);
    return () => clearTimeout(next);
  }, [touring, tourIndex, tour.length]);

  useEffect(() => {
    if (tourIndex >= 0 && tour[tourIndex]) setSelected(tour[tourIndex].slug);
  }, [tourIndex, tour]);

  const playTour = () => {
    if (tourIndex >= tour.length - 1) setTourIndex(-1);
    setTouring(true);
  };
  const stepTour = (delta) => {
    setTouring(false);
    setTourIndex((i) => Math.min(tour.length - 1, Math.max(0, i + delta)));
  };

  const regionInfo = region ? REGION_BY_KEY[region] : null;
  const countOf = (key) => sites.filter((item) => item.region === key).length;

  return (
    <section className="relative h-[100svh] min-h-[640px] overflow-hidden bg-[#EEF2EF]">
      <div className="absolute inset-0">
        <ExplorerMap
          sites={sites}
          visible={visible}
          region={region}
          selected={selected}
          trail={trail}
          padding={padding}
          onSelect={select}
        />
      </div>

      {/* Regions */}
      <div className="pointer-events-none absolute inset-x-0 top-[6.25rem] z-10 lg:top-[7.25rem]">
        <div className="pointer-events-auto mx-auto flex max-w-[1180px] gap-2 overflow-x-auto px-4 pb-2 lg:pl-[26.5rem] lg:pr-6 [scrollbar-width:none]">
          {[null, ...EXPLORER_REGIONS.map((r) => r.key)].map((key) => {
            const info = key ? REGION_BY_KEY[key] : null;
            const active = region === key;
            return (
              <button
                key={key ?? "toutes"}
                type="button"
                aria-pressed={active}
                onClick={() => chooseRegion(key)}
                className={cn(
                  "label-caps inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 shadow-[0_10px_30px_-18px_rgba(18,61,67,0.8)] backdrop-blur transition-all duration-300",
                  active ? "border-petrol bg-petrol text-ivory" : "border-white/70 bg-white/85 text-petrol hover:border-gold",
                )}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: info?.color ?? "hsl(var(--gold))" }} />
                {info ? info.label : "Toute la Guinée"}
                <span className={cn("rounded-full px-1.5 text-[0.62rem]", active ? "bg-ivory/15" : "bg-petrol/10")}>
                  {key ? countOf(key) : sites.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guided tour controls over the map on phones (the panel's own ones are below the card) */}
      {tourIndex >= 0 ? (
        <div className="absolute inset-x-4 top-[10rem] z-10 flex items-center gap-3 rounded-full bg-petrol/95 py-2 pl-2 pr-3 text-ivory shadow-xl backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={touring ? () => setTouring(false) : playTour}
            aria-label={touring ? "Mettre la visite en pause" : "Reprendre la visite"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-petrol-deep"
          >
            {touring ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] font-semibold">{site?.name ?? "Visite guidée"}</p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-ivory/15">
              <div className="h-full rounded-full bg-gold transition-[width] duration-700" style={{ width: `${((tourIndex + 1) / tour.length) * 100}%` }} />
            </div>
          </div>
          <span className="text-[0.75rem] tabular-nums text-ivory/70">
            {tourIndex + 1}/{tour.length}
          </span>
          <button type="button" onClick={stopTour} aria-label="Arrêter la visite" className="p-1 text-ivory/70 hover:text-gold">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Panel: left on computers, bottom sheet on phones */}
      <aside
        ref={panel}
        className="absolute inset-x-0 bottom-0 z-10 max-h-[46svh] overflow-y-auto rounded-t-3xl bg-white/95 shadow-[0_-20px_60px_-30px_rgba(18,61,67,0.6)] backdrop-blur-md lg:inset-x-auto lg:bottom-6 lg:left-6 lg:top-[7.25rem] lg:max-h-none lg:w-[380px] lg:rounded-3xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-petrol/15 lg:hidden" aria-hidden="true" />

        {/* Selected site, first in the panel so phones show it without scrolling */}
        {site ? (
          <article key={site.slug} className="relative animate-fade-up border-b border-petrol/10 px-6 pb-6 pt-5">
            <button
              type="button"
              onClick={() => select(null)}
              aria-label="Fermer la fiche"
              className="absolute right-8 top-8 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-petrol shadow transition-colors hover:text-gold-deep"
            >
              <X className="h-4 w-4" />
            </button>
            {site.image ? (
              <img src={site.image} alt={site.name} className="aspect-[16/10] w-full rounded-2xl object-cover" />
            ) : null}
            <p className="label-caps mt-4 flex flex-wrap items-center gap-2 pr-10" style={{ color: CATEGORY_BY_KEY[site.category]?.color }}>
              {CATEGORY_BY_KEY[site.category]?.label}
              <span className="text-petrol/40">·</span>
              <span className="text-petrol/55">{REGION_BY_KEY[site.region]?.label}</span>
            </p>
            <h3 className="mt-1.5 text-[1.3rem] font-bold leading-tight text-petrol">{site.name}</h3>
            <p className="mt-1 inline-flex flex-wrap items-center gap-1.5 text-[0.88rem] text-petrol/60">
              <MapPin className="h-3.5 w-3.5 text-gold-deep" /> {site.town}
              {site.approximate ? <span className="text-petrol/45">· position approximative</span> : null}
            </p>
            {site.description ? <p className="mt-3 text-[0.93rem] leading-relaxed text-petrol/75">{site.description}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onRequestTrip(destination?.name ?? null)}
                className="label-caps inline-flex items-center gap-2 rounded-full bg-petrol px-5 py-3 text-ivory transition-colors hover:bg-petrol-deep"
              >
                Demander ce voyage
              </button>
              {destination ? (
                <Link
                  to="/destinations/$slug"
                  params={{ slug: destination.slug }}
                  className="label-caps inline-flex items-center gap-2 rounded-full border border-petrol/25 px-5 py-3 text-petrol transition-colors hover:border-gold"
                >
                  La fiche <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </article>
        ) : null}

        <div key={region ?? "toutes"} className="animate-fade-up p-6">
          <p className="eyebrow flex items-center gap-2 text-gold-deep">
            <Compass className="h-4 w-4" /> Explorer la Guinée
          </p>
          <h2 className="mt-2 text-[1.6rem] font-extrabold leading-tight tracking-[-0.02em] text-petrol">
            {regionInfo ? regionInfo.label : "Toute la Guinée"}
          </h2>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-petrol/70">
            {regionInfo
              ? regionInfo.text
              : "Quatre régions, quatre paysages. Choisissez une région, touchez un repère, ou laissez-vous guider d'un site à l'autre."}
          </p>

          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            {SITE_CATEGORIES.map((category) => (
              <div key={category.key} className="rounded-2xl bg-ivory-soft px-2 py-3">
                <dd className="font-display text-[1.4rem] font-bold leading-none" style={{ color: category.color }}>
                  <CountUp value={inRegion.filter((item) => item.category === category.key).length} />
                </dd>
                <dt className="mt-1.5 text-[0.7rem] leading-tight text-petrol/60">{category.label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrer par type de site">
            {SITE_CATEGORIES.map((category) => {
              const on = categories.has(category.key);
              return (
                <button
                  key={category.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCategory(category.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.8rem] transition-colors",
                    on ? "border-transparent text-white" : "border-petrol/20 text-petrol/55",
                  )}
                  style={on ? { background: category.color } : undefined}
                >
                  {category.label}
                </button>
              );
            })}
          </div>

          {/* Guided tour */}
          <div className="mt-5 rounded-2xl bg-petrol p-4 text-ivory">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={touring ? () => setTouring(false) : playTour}
                disabled={tour.length < 2}
                aria-label={touring ? "Mettre la visite en pause" : "Lancer la visite guidée"}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-petrol-deep transition-transform hover:scale-105 disabled:opacity-40"
              >
                {touring ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="label-caps text-gold">Visite guidée</p>
                <p className="truncate text-[0.85rem] text-ivory/75">
                  {tourIndex >= 0 ? `Étape ${tourIndex + 1} sur ${tour.length}` : `${tour.length} sites, d'ouest en est`}
                </p>
              </div>
              {tourIndex >= 0 ? (
                <div className="flex gap-1">
                  <button type="button" onClick={() => stepTour(-1)} aria-label="Site précédent" className="rounded-full p-2 text-ivory/70 hover:text-gold">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => stepTour(1)} aria-label="Site suivant" className="rounded-full p-2 text-ivory/70 hover:text-gold">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={stopTour} aria-label="Arrêter la visite" className="rounded-full p-2 text-ivory/70 hover:text-gold">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
            {tourIndex >= 0 ? (
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-ivory/15">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-700"
                  style={{ width: `${((tourIndex + 1) / tour.length) * 100}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Sites of the region */}
        <ul className="border-t border-petrol/10 px-3 py-3">
          {shown.map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => select(item.slug)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  item.slug === selected ? "bg-gold/20" : "hover:bg-ivory-soft",
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white"
                  style={{ background: CATEGORY_BY_KEY[item.category]?.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.93rem] font-semibold text-petrol">{item.name}</span>
                  <span className="block truncate text-[0.78rem] text-petrol/55">
                    {item.town}
                    {region ? "" : ` · ${REGION_BY_KEY[item.region]?.label}`}
                  </span>
                </span>
                {item.image ? <img src={item.image} alt="" loading="lazy" className="h-10 w-12 shrink-0 rounded-lg object-cover" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
