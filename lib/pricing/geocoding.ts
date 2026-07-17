import type { Coordinates } from "@/lib/geolocation";

/**
 * Reverse geocoding via OpenStreetMap's Nominatim — turns GPS coordinates
 * into a region/province/city, to auto-fill the Location fields in
 * Profile → Shopping instead of the user having to know/type them.
 *
 * Runs client-side, in the user's own browser (normal internet access —
 * unrelated to this session's blocked outbound access, which only affects
 * this coding sandbox). Not verified end-to-end here since this sandbox
 * can't reach nominatim.openstreetmap.org either; built against Nominatim's
 * documented jsonv2 response format.
 *
 * Nominatim's usage policy expects light, occasional use with attribution
 * (shown in the UI) and asks heavier apps to self-host or use a paid
 * provider — reasonable for a single user's occasional manual lookup here,
 * but worth revisiting if this app grows real traffic.
 */
export interface ReverseGeocodeResult {
  region?: string;
  province?: string;
  city?: string;
  displayName: string;
}

const NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";

interface NominatimAddress {
  city?: string;
  municipality?: string;
  town?: string;
  state?: string;
  county?: string;
  region?: string;
}

/** Maps Nominatim's address fields onto Mise's region/province/city — best-effort, since PH addressing in OSM data is inconsistent; never guesses a field it doesn't have. */
export function mapNominatimAddress(address: NominatimAddress): Omit<ReverseGeocodeResult, "displayName"> {
  return {
    city: address.city ?? address.municipality ?? address.town ?? undefined,
    province: address.state ?? address.county ?? undefined,
    region: address.region ?? undefined,
  };
}

export async function reverseGeocode(coords: Coordinates): Promise<ReverseGeocodeResult | null> {
  const url = new URL(NOMINATIM_REVERSE_ENDPOINT);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(coords.lat));
  url.searchParams.set("lon", String(coords.lon));
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "14");

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Couldn't reach OpenStreetMap's location lookup.");
  const data = await response.json();
  const mapped = mapNominatimAddress(data.address ?? {});
  if (!mapped.city && !mapped.province && !mapped.region) return null;
  return { ...mapped, displayName: data.display_name ?? "" };
}
