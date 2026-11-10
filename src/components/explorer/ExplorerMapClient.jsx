import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import GEO from "@/data/geo/guinee-regions.json";
import { CATEGORY_BY_KEY, EXPLORER_REGIONS, GEO_ATTRIBUTION } from "@/data/explorer";

// MapLibre, browser only: loaded lazily by ExplorerMap.jsx. Vector basemap from OpenFreeMap
// (free, no key); if it cannot load, a plain background keeps the regions and sites usable.

maplibregl.setWorkerUrl(workerUrl);

const BASEMAP = "https://tiles.openfreemap.org/styles/positron";
const FALLBACK_STYLE = {
  version: 8,
  sources: {},
  layers: [{ id: "fond", type: "background", paint: { "background-color": "#EEF2EF" } }],
};
const COUNTRY_BOUNDS = [
  [-15.2, 7.15],
  [-7.6, 12.7],
];
const REGION_COLORS = ["match", ["get", "region"], ...EXPLORER_REGIONS.flatMap((r) => [r.key, r.color]), "#999"];

function boundsOf(features) {
  const bounds = new maplibregl.LngLatBounds();
  for (const feature of features) {
    for (const polygon of feature.geometry.coordinates) for (const point of polygon[0]) bounds.extend(point);
  }
  return bounds;
}
const REGION_BOUNDS = Object.fromEntries(
  EXPLORER_REGIONS.map((region) => [region.key, boundsOf(GEO.regions.features.filter((f) => f.properties.region === region.key))]),
);

const lineData = (coordinates) => ({
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates: coordinates.length > 1 ? coordinates : [] },
});

// The sources and layers drawn over the basemap; added again whenever the style (re)loads.
function addLayers(map) {
  if (map.getSource("regions")) return;
  map.addSource("regions", { type: "geojson", data: GEO.regions });
  map.addSource("contour", { type: "geojson", data: lineData([]) });
  map.addSource("trajet", { type: "geojson", data: lineData([]), lineMetrics: true });
  map.addLayer({
    id: "regions-fond",
    type: "fill",
    source: "regions",
    paint: { "fill-color": REGION_COLORS, "fill-opacity": 0, "fill-opacity-transition": { duration: 900 } },
  });
  map.addLayer({
    id: "regions-bord",
    type: "line",
    source: "regions",
    paint: {
      "line-color": "#FFFFFF",
      "line-width": 1.2,
      "line-opacity": 0,
      "line-opacity-transition": { duration: 900 },
    },
  });
  map.addLayer({
    id: "contour",
    type: "line",
    source: "contour",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#123D43", "line-width": 2.2 },
  });
  map.addLayer({
    id: "trajet-halo",
    type: "line",
    source: "trajet",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#123D43", "line-width": 7, "line-opacity": 0.18 },
  });
  map.addLayer({
    id: "trajet",
    type: "line",
    source: "trajet",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#E6B45C", "line-width": 3, "line-dasharray": [1.5, 1.6] },
  });
}

// Highlights the chosen region (or all of them), the others fading back.
function paintRegions(map, region) {
  if (!map.getLayer("regions-fond")) return;
  map.setPaintProperty(
    "regions-fond",
    "fill-opacity",
    region ? ["case", ["==", ["get", "region"], region], 0.42, 0.08] : 0.36,
  );
  map.setPaintProperty("regions-bord", "line-opacity", 0.9);
}

// Place names in French where OpenStreetMap has them, else in their local form.
function frenchLabels(map) {
  for (const layer of map.getStyle().layers) {
    if (layer.type === "symbol" && map.getLayoutProperty(layer.id, "text-field")) {
      map.setLayoutProperty(layer.id, "text-field", ["coalesce", ["get", "name:fr"], ["get", "name"]]);
    }
  }
}

function markerElement(site, onSelect) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "explorer-pin";
  element.style.setProperty("--pin-color", CATEGORY_BY_KEY[site.category]?.color ?? "#123D43");
  element.setAttribute("aria-label", `${site.name}, ${site.town}`);
  element.innerHTML = `<span class="explorer-pin__ring"></span><span class="explorer-pin__dot"></span><span class="explorer-pin__label"></span>`;
  element.querySelector(".explorer-pin__label").textContent = site.name;
  element.addEventListener("click", (event) => {
    event.stopPropagation();
    onSelect(site.slug);
  });
  return element;
}

/**
 * `sites`: all published sites; `visible`: the slugs to show (region and type filters);
 * `region`: the region the camera frames (null: all of Guinea); `selected`: the site the camera
 * flies to; `trail`: the guided tour's path so far, its newest leg drawn progressively;
 * `padding`: room left for the panels over the map.
 */
export default function ExplorerMapClient({ sites, visible, region, selected, trail, padding, onSelect, onReady }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef(new Map());
  const ready = useRef(false);
  const shownTrail = useRef([]);
  const latest = useRef({ region, padding, onSelect });
  latest.current = { region, padding, onSelect };

  // The map, once: outline drawn around Guinea, then the regions fade in.
  useEffect(() => {
    const map = new maplibregl.Map({
      container: container.current,
      style: BASEMAP,
      bounds: COUNTRY_BOUNDS,
      fitBoundsOptions: { padding: withMargin(padding, 30) },
      attributionControl: { compact: true, customAttribution: GEO_ATTRIBUTION },
      dragRotate: false,
      pitchWithRotate: false,
      cooperativeGestures: false,
      maxZoom: 13,
      minZoom: 4,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
    map.scrollZoom.disable();
    map.on("click", () => latest.current.onSelect(null));

    let fellBack = false;
    map.on("error", (event) => {
      // The basemap failed (offline, service down): keep going on a plain background.
      if (!fellBack && !map.isStyleLoaded() && /style|fetch|Failed/i.test(String(event.error?.message))) {
        fellBack = true;
        map.setStyle(FALLBACK_STYLE);
      }
    });

    let frame = 0;
    map.on("style.load", () => {
      frenchLabels(map);
      addLayers(map);
      if (ready.current) {
        paintRegions(map, latest.current.region);
        map.getSource("contour").setData(lineData(GEO.outline.geometry.coordinates));
        return;
      }
      const outline = GEO.outline.geometry.coordinates;
      const start = performance.now();
      const draw = (now) => {
        const progress = Math.min(1, (now - start) / 1800);
        const eased = 1 - Math.pow(1 - progress, 3);
        map.getSource("contour")?.setData(lineData(outline.slice(0, Math.max(2, Math.round(eased * outline.length)))));
        if (progress < 1) {
          frame = requestAnimationFrame(draw);
        } else {
          ready.current = true;
          paintRegions(map, latest.current.region);
          onReady?.();
        }
      };
      frame = requestAnimationFrame(draw);
    });

    return () => {
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
      markers.current.clear();
    };
  }, []);

  // One marker per site, created once.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = markers.current;
    for (const site of sites) {
      if (current.has(site.slug)) continue;
      const element = markerElement(site, (slug) => latest.current.onSelect(slug));
      const marker = new maplibregl.Marker({ element, anchor: "center" }).setLngLat([site.longitude, site.latitude]).addTo(map);
      current.set(site.slug, { marker, element });
    }
    for (const [slug, { marker }] of current) {
      if (!sites.some((site) => site.slug === slug)) {
        marker.remove();
        current.delete(slug);
      }
    }
  }, [sites]);

  // Filters: hidden pins shrink away, the others drop in one after the other.
  useEffect(() => {
    let index = 0;
    for (const [slug, { element }] of markers.current) {
      const show = visible.has(slug);
      element.classList.toggle("is-hidden", !show);
      element.tabIndex = show ? 0 : -1;
      if (show) {
        element.style.setProperty("--pin-delay", `${Math.min(index, 24) * 35}ms`);
        element.classList.remove("is-dropping");
        void element.offsetWidth; // restart the animation
        element.classList.add("is-dropping");
        index += 1;
      }
    }
  }, [visible]);

  // Region: tilted flight to its bounds, or back to the whole country.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    paintRegions(map, ready.current ? region : null);
    if (selected) return;
    const bounds = region ? REGION_BOUNDS[region] : new maplibregl.LngLatBounds(COUNTRY_BOUNDS);
    const camera = map.cameraForBounds(bounds, { padding: withMargin(padding, 40) });
    if (camera) map.flyTo({ ...camera, pitch: region ? 42 : 0, bearing: region ? -12 : 0, duration: 2200, essential: true });
  }, [region]);

  // Selected site: its pin lights up and the camera glides to it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [slug, { element }] of markers.current) element.classList.toggle("is-active", slug === selected);
    const site = sites.find((item) => item.slug === selected);
    if (!site) return;
    map.flyTo({
      center: [site.longitude, site.latitude],
      zoom: Math.max(map.getZoom(), 9.2),
      pitch: 52,
      bearing: -18,
      padding: withMargin(padding, 0),
      duration: 2400,
      curve: 1.6,
      essential: true,
    });
  }, [selected]);

  // Guided tour: the newest leg of the path is drawn as the camera travels along it.
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("trajet");
    if (!source) {
      shownTrail.current = trail;
      return;
    }
    const previous = shownTrail.current;
    shownTrail.current = trail;
    const extendsByOne =
      trail.length === previous.length + 1 && previous.every((point, i) => point[0] === trail[i][0] && point[1] === trail[i][1]);
    if (!extendsByOne || trail.length < 2) {
      source.setData(lineData(trail));
      return;
    }
    const from = trail[trail.length - 2];
    const to = trail[trail.length - 1];
    const start = performance.now();
    let frame = 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / 2200);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const head = [from[0] + (to[0] - from[0]) * eased, from[1] + (to[1] - from[1]) * eased];
      source.setData(lineData([...trail.slice(0, -1), head]));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [trail]);

  return <div ref={container} className="h-full w-full" />;
}

const withMargin = (padding, margin) => ({
  top: (padding?.top ?? 0) + margin,
  right: (padding?.right ?? 0) + margin,
  bottom: (padding?.bottom ?? 0) + margin,
  left: (padding?.left ?? 0) + margin,
});
