export type LatLng = { latitude: number; longitude: number };

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Angular distance between two points, in radians. */
function angularDistance(from: LatLng, to: LatLng): number {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLat = lat2 - lat1;
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Kilometres between two points, on a sphere of mean radius.
 *
 * Lands within ~0.2% of an ellipsoidal (WGS84) figure — fine for sanity checks
 * and for sizing a map, but the distance actually SHOWN comes from the flight
 * API, so the two never disagree on screen.
 */
export function distanceKm(from: LatLng, to: LatLng): number {
  return angularDistance(from, to) * 6371;
}

/**
 * Points along the great circle between two coordinates.
 *
 * A straight line on a Mercator map is not the route a plane flies — Tokyo to
 * Singapore bows west of the rhumb line. Interpolating on the sphere draws the
 * path that actually gets flown.
 */
export function greatCirclePath(from: LatLng, to: LatLng, segments = 64): LatLng[] {
  const d = angularDistance(from, to);
  if (d === 0 || !Number.isFinite(d)) return [from, to];

  const lat1 = toRad(from.latitude);
  const lon1 = toRad(from.longitude);
  const lat2 = toRad(to.latitude);
  const lon2 = toRad(to.longitude);
  const sinD = Math.sin(d);

  const points: LatLng[] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const a = Math.sin((1 - f) * d) / sinD;
    const b = Math.sin(f * d) / sinD;
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    points.push({
      latitude: toDeg(Math.atan2(z, Math.hypot(x, y))),
      longitude: toDeg(Math.atan2(y, x)),
    });
  }
  return points;
}

/** A region that comfortably contains every point given. */
export function regionFor(points: LatLng[], padding = 1.6) {
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * padding, 1),
    longitudeDelta: Math.max((maxLon - minLon) * padding, 1),
  };
}

/** Equirectangular projection into a 360x180 space, matching the world path. */
export function projectEquirect(point: LatLng): { x: number; y: number } {
  return { x: point.longitude + 180, y: 90 - point.latitude };
}

/**
 * Projects a path, letting longitude run past the edges of the world.
 *
 * A Tokyo to Los Angeles great circle crosses the antimeridian. Wrapped into
 * 0-360 it teleports from one edge to the other; unwrapped, x simply keeps
 * climbing past 360 and the line stays continuous. The map itself is drawn
 * more than once side by side so there is always world underneath.
 */
export function unwrapPath(points: LatLng[]): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  let offset = 0;
  points.forEach((point, index) => {
    const projected = projectEquirect(point);
    const previous = out[index - 1];
    if (previous) {
      const delta = projected.x + offset - previous.x;
      if (delta > 180) offset -= 360;
      else if (delta < -180) offset += 360;
    }
    out.push({ x: projected.x + offset, y: projected.y });
  });
  return out;
}

/** SVG path data for a run of projected points. */
export function toSvgPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('');
}

/**
 * A viewBox framing the whole route, padded, matching the container's aspect.
 *
 * Built from every point on the path rather than just the endpoints, because
 * a great circle can bow a long way outside the box its ends describe.
 * Longitude is not clamped — the world is tiled horizontally — but latitude is,
 * since there is nothing above the pole.
 */
export function routeViewBox(points: { x: number; y: number }[], aspect: number, pad = 14) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  let minX = Math.min(...xs) - pad;
  let maxX = Math.max(...xs) + pad;
  let minY = Math.min(...ys) - pad;
  let maxY = Math.max(...ys) + pad;

  let width = maxX - minX;
  let height = maxY - minY;
  if (width / height < aspect) {
    const grow = (height * aspect - width) / 2;
    minX -= grow;
    width = height * aspect;
  } else {
    const grow = (width / aspect - height) / 2;
    minY -= grow;
    height = width / aspect;
  }

  if (height >= 180) {
    minY = (180 - height) / 2;
  } else {
    minY = Math.max(0, Math.min(minY, 180 - height));
  }
  return { x: minX, y: minY, width, height };
}
