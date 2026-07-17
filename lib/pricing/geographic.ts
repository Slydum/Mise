/**
 * PSA retail-price data is published at several geographic granularities.
 * Mise always prefers the most locally-specific figure available and labels
 * exactly which one it used — a national average must never be presented
 * as if it were the user's city price.
 */
export type GeographicLevel = "city" | "province" | "region" | "national";

const LEVEL_ORDER: GeographicLevel[] = ["city", "province", "region", "national"];

const LEVEL_LABELS: Record<GeographicLevel, string> = {
  city: "City reference",
  province: "Provincial reference",
  region: "Regional reference",
  national: "National reference",
};

export function geographicLevelLabel(level: GeographicLevel): string {
  return LEVEL_LABELS[level];
}

export interface GeographicCandidate<T> {
  level: GeographicLevel;
  value: T;
}

/**
 * Picks the most locally-specific candidate that's actually available —
 * city, then province, then region, then national. Never falls back to a
 * broader level unless the narrower ones are genuinely absent.
 */
export function resolveGeographicFallback<T>(
  candidates: Partial<Record<GeographicLevel, T>>,
): GeographicCandidate<T> | undefined {
  for (const level of LEVEL_ORDER) {
    const value = candidates[level];
    if (value !== undefined) return { level, value };
  }
  return undefined;
}

/** Derives which geographic level a CommodityPrice actually represents, from whichever of city/province/region it has populated. */
export function geographicLevelOf(price: { city?: string; province?: string; region?: string }): GeographicLevel {
  if (price.city) return "city";
  if (price.province) return "province";
  if (price.region) return "region";
  return "national";
}
