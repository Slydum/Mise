import { geographicLevelOf } from "@/lib/pricing/geographic";
import type { CommodityPrice } from "@/lib/pricing/types";

export interface PriceMatchContext {
  canonicalIngredientKey: string;
  /** Exact-package context — required to match a receipt, a user-verified price, or a DTI monitored package. Irrelevant to PSA references and to a weighted (per-kg/per-liter) receipt/verified rate, both of which price the commodity, not a package. */
  packageAmount?: number;
  packageUnit?: string;
  storeId?: string;
}

/**
 * Lower number = higher priority. Receipt and user-verified prices are
 * exact-product tiers; DTI is an exact monitored package but not
 * store-specific; PSA splits into four geographic sub-tiers, each strictly
 * below DTI, so a broad commodity reference can never outrank a real
 * checkout price.
 */
function tierOf(price: CommodityPrice): number {
  switch (price.source) {
    case "receipt":
      return 1;
    case "user-verified":
      return 2;
    case "dti-epresyo":
      return 3;
    case "psa-openstat":
    case "psa-price-situationer": {
      const geoOffset: Record<string, number> = { city: 0, province: 1, region: 2, national: 3 };
      return 4 + geoOffset[geographicLevelOf(price)];
    }
  }
}

function matchesRequiredContext(price: CommodityPrice, context: PriceMatchContext): boolean {
  if (price.canonicalIngredientKey !== context.canonicalIngredientKey) return false;

  switch (price.source) {
    case "receipt":
    case "user-verified":
      if (price.isWeighted) {
        // A per-kg/per-liter rate applies regardless of how much is bought — only the store matters, like a PSA reference.
        return !price.storeId || price.storeId === context.storeId;
      }
      // A price logged for one package size/branch never silently substitutes for another.
      return (
        price.amount === context.packageAmount &&
        price.unit === context.packageUnit &&
        (!price.storeId || price.storeId === context.storeId)
      );
    case "dti-epresyo":
      // DTI monitors specific packages/prices but isn't store-specific.
      return price.amount === context.packageAmount && price.unit === context.packageUnit;
    case "psa-openstat":
    case "psa-price-situationer":
      // Commodity-level reference — no package/store to match.
      return true;
  }
}

/** Within the same PSA geographic tier, prefer the Price Situationer over OpenSTAT when it's at least as recent. */
function psaTieBreak(a: CommodityPrice, b: CommodityPrice): number {
  const aIsSituationer = a.source === "psa-price-situationer";
  const bIsSituationer = b.source === "psa-price-situationer";
  if (aIsSituationer && !bIsSituationer) return a.referencePeriod >= b.referencePeriod ? -1 : 1;
  if (bIsSituationer && !aIsSituationer) return b.referencePeriod >= a.referencePeriod ? 1 : -1;
  return b.referencePeriod.localeCompare(a.referencePeriod);
}

/**
 * Resolves the single price to use for a grocery item, per the 8-tier
 * priority (receipt > user-verified > DTI > PSA city > province > region
 * > national > unavailable). Never lets one package size's price stand in
 * for another, and never promotes a PSA/DTI commodity reference to
 * `isExactStorePrice`.
 */
export function resolvePrice(context: PriceMatchContext, candidates: CommodityPrice[]): CommodityPrice | undefined {
  const applicable = candidates.filter((p) => matchesRequiredContext(p, context));
  if (applicable.length === 0) return undefined;

  return applicable.slice().sort((a, b) => {
    const tierDiff = tierOf(a) - tierOf(b);
    if (tierDiff !== 0) return tierDiff;
    if (
      (a.source === "psa-openstat" || a.source === "psa-price-situationer") &&
      (b.source === "psa-openstat" || b.source === "psa-price-situationer")
    ) {
      return psaTieBreak(a, b);
    }
    return b.referencePeriod.localeCompare(a.referencePeriod);
  })[0];
}
