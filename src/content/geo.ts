import type { Temple } from './schema';

const R_KM = 6371.0088;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function nearestTemples(
  ts: Temple[],
  p: { lat: number; lng: number },
  n = 5,
): { temple: Temple; km: number }[] {
  return ts
    .map((temple) => ({ temple, km: haversineKm(p, temple.location) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}
