import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { hasPosition } from "@/lib/coordinates";
import { cn } from "@/lib/utils";

// Leaflet touches `window` on import, so the map only loads in the browser; the server
// (and the first client render) show a same-size placeholder. Pages with a map add
// leaflet.css to their head() (see LEAFLET_CSS).
const GuineaMapClient = lazy(() => import("@/components/map/GuineaMapClient"));

export { default as LEAFLET_CSS } from "leaflet/dist/leaflet.css?url";

export function Placeholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-petrol/5">
      <MapPin className="h-6 w-6 animate-pulse text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}

/**
 * The destinations on a map of Guinea. `points`: destinations ({ slug, name, region,
 * image, latitude, longitude }); those without coordinates are left out. `single`: one
 * destination, zoomed in, without the "Découvrir" link.
 */
export default function GuineaMap({ points = [], single = false, className }) {
  const located = points.filter(hasPosition);
  if (!located.length) return null;

  return (
    <div className={cn("sysi-map relative isolate overflow-hidden border border-petrol/15", className)}>
      <ClientOnly fallback={<Placeholder />}>
        <Suspense fallback={<Placeholder />}>
          <GuineaMapClient points={located} single={single} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
