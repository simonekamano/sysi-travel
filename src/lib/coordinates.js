// GPS coordinates typed in the administration (destinations, circuit steps).

// "9.5092, -13.7122" (as Google Maps copies it) -> { latitude, longitude }; empty -> nulls;
// anything else -> null.
export function parseCoordinates(value) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { latitude: null, longitude: null };
  const parts = trimmed.split(/[,;\s]+/).filter(Boolean).map(Number);
  if (parts.length !== 2 || parts.some((n) => !Number.isFinite(n))) return null;
  const [latitude, longitude] = parts;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export const formatCoordinates = (record) =>
  record?.latitude != null && record?.longitude != null ? `${record.latitude}, ${record.longitude}` : "";

export const hasPosition = (point) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);
