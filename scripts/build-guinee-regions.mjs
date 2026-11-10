// Builds src/data/geo/guinee-regions.json: the 4 natural regions and the country outline, from
// the 34 prefectures of geoBoundaries GIN ADM2 (CC BY 3.0 IGO, WFP / OCHA ROWCA), simplified file:
//   https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/GIN/ADM2/geoBoundaries-GIN-ADM2_simplified.geojson
//   node scripts/build-guinee-regions.mjs geoBoundaries-GIN-ADM2_simplified.geojson 0.008 src/data/geo/guinee-regions.json
// An edge shared by two polygons of the same group is internal: dropping those edges and
// chaining the rest gives each group's outer rings. Rings are then simplified.
import { readFileSync, writeFileSync } from "node:fs";

const REGIONS = {
  basse: ["Boffa", "Boke", "Conakry", "Coyah", "Dubreka", "Forecariah", "Fria", "Gaoual", "Kindia", "Koundara", "Telimele"],
  moyenne: ["Dalaba", "Koubia", "Labe", "Lelouma", "Mali", "Mamou", "Pita", "Tougue"],
  haute: ["Dabola", "Dinguiraye", "Faranah", "Kankan", "Kerouane", "Kouroussa", "Mandiana", "Siguiri"],
  forestiere: ["Beyla", "Gueckedou", "Kissidougou", "Lola", "Macenta", "Nzerekore", "Yomou"],
};
const regionOf = (name) => Object.keys(REGIONS).find((key) => REGIONS[key].includes(name));

const data = JSON.parse(readFileSync(process.argv[2], "utf8"));
const key = ([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`;

function ringsOf(feature) {
  const g = feature.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.flatMap((poly) => poly); // outer rings and holes (none expected)
}

function outerRings(features) {
  const count = new Map();
  const edges = [];
  for (const feature of features) {
    for (const ring of ringsOf(feature)) {
      for (let i = 0; i < ring.length - 1; i++) {
        const a = key(ring[i]), b = key(ring[i + 1]);
        if (a === b) continue;
        const id = a < b ? `${a}|${b}` : `${b}|${a}`;
        count.set(id, (count.get(id) || 0) + 1);
        edges.push({ id, from: a, to: b, p: ring[i], q: ring[i + 1] });
      }
    }
  }
  const boundary = edges.filter((e) => count.get(e.id) === 1);
  const next = new Map();
  for (const e of boundary) {
    if (!next.has(e.from)) next.set(e.from, []);
    next.get(e.from).push(e);
  }
  const used = new Set();
  const rings = [];
  for (const start of boundary) {
    if (used.has(start)) continue;
    const ring = [start.p];
    let edge = start;
    while (edge && !used.has(edge)) {
      used.add(edge);
      ring.push(edge.q);
      edge = (next.get(edge.to) || []).find((e) => !used.has(e));
    }
    if (ring.length > 3) rings.push(ring);
  }
  return rings;
}

// Douglas–Peucker in degrees.
function simplify(points, tolerance) {
  if (points.length < 4) return points;
  const keep = new Array(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const [x1, y1] = points[s], [x2, y2] = points[e];
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1e-12;
    let max = 0, index = -1;
    for (let i = s + 1; i < e; i++) {
      const [x, y] = points[i];
      const d = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / len;
      if (d > max) { max = d; index = i; }
    }
    if (max > tolerance && index > 0) {
      keep[index] = true;
      stack.push([s, index], [index, e]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const round = (ring) => ring.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);
// A closed ring starts and ends on the same point, which Douglas–Peucker cannot measure
// against: split it at the point farthest from the start and simplify both halves.
const simplifyRing = (ring, tolerance) => {
  const [x0, y0] = ring[0];
  let far = 1;
  ring.forEach(([x, y], i) => {
    if (Math.hypot(x - x0, y - y0) > Math.hypot(ring[far][0] - x0, ring[far][1] - y0)) far = i;
  });
  return [...simplify(ring.slice(0, far + 1), tolerance), ...simplify(ring.slice(far), tolerance).slice(1)];
};
const finish = (ring, tolerance) => {
  const simple = round(simplifyRing(ring, tolerance));
  if (key(simple[0]) !== key(simple[simple.length - 1])) simple.push(simple[0]);
  return simple;
};
const area = (ring) => Math.abs(ring.reduce((sum, [x, y], i) => {
  const [nx, ny] = ring[(i + 1) % ring.length];
  return sum + x * ny - nx * y;
}, 0) / 2);

const TOLERANCE = Number(process.argv[3] || 0.008);
const out = { type: "FeatureCollection", features: [] };
for (const region of Object.keys(REGIONS)) {
  const features = data.features.filter((f) => regionOf(f.properties.shapeName) === region);
  const rings = outerRings(features).map((ring) => finish(ring, TOLERANCE)).filter((ring) => ring.length >= 4 && area(ring) > 1e-4);
  out.features.push({
    type: "Feature",
    properties: { region },
    geometry: { type: "MultiPolygon", coordinates: rings.map((ring) => [ring]) },
  });
  console.log(region, features.length, "préfectures,", rings.length, "contour(s),", rings.reduce((n, r) => n + r.length, 0), "points");
}
const countryRings = outerRings(data.features).map((ring) => finish(ring, TOLERANCE)).filter((ring) => ring.length >= 4);
countryRings.sort((a, b) => area(b) - area(a));
const outline = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: countryRings[0] } };
console.log("pays:", countryRings.length, "contour(s), principal:", countryRings[0].length, "points");
const unknown = data.features.filter((f) => !regionOf(f.properties.shapeName)).map((f) => f.properties.shapeName);
if (unknown.length) throw new Error("Préfectures sans région : " + unknown.join(", "));
writeFileSync(process.argv[4], JSON.stringify({ regions: out, outline }));
