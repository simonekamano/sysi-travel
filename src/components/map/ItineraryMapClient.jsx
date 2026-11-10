import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

// Leaflet itself, browser only: loaded lazily by ItineraryMap.jsx.

// A numbered disc per day; the active day is gold and larger (styles: .sysi-step in index.css).
const stepIcon = (day, active) =>
  L.divIcon({
    className: `sysi-step${active ? " sysi-step--active" : ""}`,
    html: `<span class="sysi-step__disc">${day}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    tooltipAnchor: [16, 0],
  });

// Frames the whole route first, then glides to the active day whenever it changes.
function FollowActive({ steps, active }) {
  const map = useMap();

  useEffect(() => {
    const step = steps.find((item) => item.day === active);
    if (step) {
      map.flyTo([step.latitude, step.longitude], Math.max(map.getZoom(), 9), { duration: 0.8 });
    } else if (steps.length > 1) {
      map.flyToBounds(L.latLngBounds(steps.map((item) => [item.latitude, item.longitude])).pad(0.3), { duration: 0.8 });
    }
  }, [map, steps, active]);

  return null;
}

export default function ItineraryMapClient({ steps, active, onSelect }) {
  const positions = useMemo(() => steps.map((step) => [step.latitude, step.longitude]), [steps]);
  const view =
    positions.length > 1 ? { bounds: L.latLngBounds(positions).pad(0.3) } : { center: positions[0], zoom: 10 };

  return (
    <MapContainer {...view} scrollWheelZoom={false} className="h-full w-full" attributionControl>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={17}
      />
      {positions.length > 1 ? (
        <>
          <Polyline positions={positions} pathOptions={{ color: "#123D43", weight: 5, opacity: 0.18 }} />
          <Polyline positions={positions} pathOptions={{ color: "#B8862F", weight: 2.5, dashArray: "8 8" }} />
        </>
      ) : null}
      {steps.map((step) => (
        <Marker
          key={step.day}
          position={[step.latitude, step.longitude]}
          icon={stepIcon(step.day, step.day === active)}
          zIndexOffset={step.day === active ? 1000 : 0}
          eventHandlers={{ click: () => onSelect?.(step.day) }}
          title={`Jour ${step.day}`}
        >
          <Tooltip direction="right" className="sysi-step-tooltip">
            <strong>Jour {step.day}</strong> · {step.place || step.title}
          </Tooltip>
        </Marker>
      ))}
      <FollowActive steps={steps} active={active} />
    </MapContainer>
  );
}
