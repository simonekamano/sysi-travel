import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Placeholder } from "@/components/map/GuineaMap";
import { cn } from "@/lib/utils";

// Leaflet is browser only (see GuineaMap.jsx): the server renders a placeholder.
const ItineraryMapClient = lazy(() => import("@/components/map/ItineraryMapClient"));

/**
 * A circuit's itinerary: one numbered pin per located day, joined in travel order.
 * `steps`: [{ day, title, place, latitude, longitude }] (located days only);
 * `active`: the day shown, the map flies to it; `onSelect(day)`: a pin was clicked.
 */
export default function ItineraryMap({ steps, active, onSelect, className }) {
  if (!steps.length) return null;

  return (
    <div className={cn("sysi-map relative isolate overflow-hidden border border-petrol/15 bg-ivory", className)}>
      <ClientOnly fallback={<Placeholder />}>
        <Suspense fallback={<Placeholder />}>
          <ItineraryMapClient steps={steps} active={active} onSelect={onSelect} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
