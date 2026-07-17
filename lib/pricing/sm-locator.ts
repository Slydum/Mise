import { haversineDistanceMeters, type Coordinates } from "@/lib/geolocation";

/**
 * Finds nearby SM Markets branches via OpenStreetMap's Overpass API —
 * community-mapped store locations, not an official SM directory. Runs
 * client-side in the user's own browser. Results are exactly what OSM has
 * tagged nearby: coverage varies by area and isn't guaranteed complete, so
 * this always surfaces real candidates for the user to confirm (see
 * components/profile/shopping-settings-card.tsx), never auto-selects one.
 *
 * Not verified end-to-end here since this sandbox can't reach
 * overpass-api.de either; built against Overpass's documented JSON output
 * format (`out center` for ways/relations, `out` for nodes).
 */
export interface NearbySmStore {
  name: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  address?: string;
}

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

function buildOverpassQuery(coords: Coordinates, radiusMeters: number): string {
  const around = `around:${radiusMeters},${coords.lat},${coords.lon}`;
  const nameFilter = '["name"~"SM Supermarket|SM Hypermarket|SM Market|Savemore",i]';
  return `
    [out:json][timeout:15];
    (
      node(${around})["shop"~"supermarket|convenience|department_store"]${nameFilter};
      way(${around})["shop"~"supermarket|convenience|department_store"]${nameFilter};
    );
    out center;
  `;
}

interface OverpassElement {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Turns raw Overpass elements into sorted, deduplicated nearby-store candidates. Pure — no network access — so it's directly testable against fixture data. */
export function rankNearbyStores(elements: OverpassElement[], from: Coordinates, limit = 8): NearbySmStore[] {
  const seen = new Set<string>();
  const stores: NearbySmStore[] = [];

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat === undefined || lon === undefined) continue;
    const name = el.tags?.name ?? "SM";
    const key = `${name}::${lat.toFixed(4)}::${lon.toFixed(4)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const addressParts = [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean);
    stores.push({
      name,
      lat,
      lon,
      distanceMeters: haversineDistanceMeters(from, { lat, lon }),
      address: addressParts.length > 0 ? addressParts.join(", ") : undefined,
    });
  }

  return stores.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, limit);
}

export async function findNearbySmStores(coords: Coordinates, radiusMeters = 15_000): Promise<NearbySmStore[]> {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: buildOverpassQuery(coords, radiusMeters),
  });
  if (!response.ok) throw new Error("Couldn't reach OpenStreetMap's store directory.");
  const data = await response.json();
  return rankNearbyStores(data.elements ?? [], coords);
}
