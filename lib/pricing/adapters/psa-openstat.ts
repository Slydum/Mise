import type { PriceAdapter, PriceAdapterParams, PriceAdapterResult } from "@/lib/pricing/types";

/**
 * PSA OpenSTAT retail-price tables (openstat.psa.gov.ph) for agricultural
 * commodities — cereals, root crops, beans/legumes, condiments, fruit and
 * leafy vegetables, fruits, fish.
 *
 * There is no live connection: this session's outbound web access is
 * blocked at the environment/proxy level for every external host, PSA's
 * domain included (verified directly — not assumed) — see README.md. This
 * adapter is the honest seam a real implementation plugs into: it never
 * fetches and never fabricates a plausible-looking price.
 */
export const PSA_OPENSTAT_UNAVAILABLE_REASON =
  "No live connection to PSA OpenSTAT. This session has no outbound web access to openstat.psa.gov.ph — see README.md.";

export const psaOpenStatAdapter: PriceAdapter = {
  source: "psa-openstat",
  async fetchPrices(_params: PriceAdapterParams): Promise<PriceAdapterResult> {
    return { status: "integration-unavailable", prices: [], reason: PSA_OPENSTAT_UNAVAILABLE_REASON };
  },
};

/**
 * Normalizes a reported price into PHP per kilogram (or per liter for
 * liquids), so PSA figures reported at any package size compare on a
 * common base. Real, tested logic — used the moment real OpenSTAT rows
 * exist, even though none do today.
 */
export function normalizeToPerKgOrLiter(amount: number, unit: "g" | "kg" | "ml" | "L", pricePhp: number): number {
  switch (unit) {
    case "g":
      return (pricePhp / amount) * 1000;
    case "kg":
      return pricePhp / amount;
    case "ml":
      return (pricePhp / amount) * 1000;
    case "L":
      return pricePhp / amount;
  }
}
