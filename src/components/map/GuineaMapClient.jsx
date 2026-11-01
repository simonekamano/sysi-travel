import { Link } from "@tanstack/react-router";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

// Leaflet itself, browser only: loaded lazily by GuineaMap.jsx.

const GUINEA_CENTER = [10.4, -11.2];

// A drawn pin (gold drop, petrol ring): no image files to resolve through the bundler.
const pinIcon = L.divIcon({
  className: "sysi-pin",
  html: '<span class="sysi-pin__pulse"></span><span class="sysi-pin__drop"></span>',
  iconSize: [30, 38],
  iconAnchor: [15, 36],
  popupAnchor: [0, -34],
});

export default function GuineaMapClient({ points, single = false }) {
  const positions = points.map((point) => [point.latitude, point.longitude]);
  const view =
    single || positions.length < 2
      ? { center: positions[0] ?? GUINEA_CENTER, zoom: single ? 9 : 6 }
      : { bounds: L.latLngBounds(positions).pad(0.25) };

  return (
    <MapContainer {...view} scrollWheelZoom={false} className="h-full w-full" attributionControl>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={17}
      />
      {points.map((point) => (
        <Marker key={point.slug} position={[point.latitude, point.longitude]} icon={pinIcon} title={point.name}>
          <Popup className="sysi-popup" minWidth={220} maxWidth={240}>
            {point.image ? <img src={point.image} alt="" className="sysi-popup__image" /> : null}
            <div className="sysi-popup__body">
              <p className="sysi-popup__region">{point.region}</p>
              <p className="sysi-popup__name">{point.name}</p>
              {single ? null : (
                <Link to="/destinations/$slug" params={{ slug: point.slug }} className="sysi-popup__link">
                  Découvrir →
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
