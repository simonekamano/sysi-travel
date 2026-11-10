import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Placeholder } from "@/components/map/GuineaMap";

// MapLibre touches `window` and WebGL: the map only loads in the browser. The page adds
// maplibre-gl.css to its head (MAPLIBRE_CSS).
const ExplorerMapClient = lazy(() => import("@/components/explorer/ExplorerMapClient"));

export { default as MAPLIBRE_CSS } from "maplibre-gl/dist/maplibre-gl.css?url";

export default function ExplorerMap(props) {
  return (
    <ClientOnly fallback={<Placeholder />}>
      <Suspense fallback={<Placeholder />}>
        <ExplorerMapClient {...props} />
      </Suspense>
    </ClientOnly>
  );
}
