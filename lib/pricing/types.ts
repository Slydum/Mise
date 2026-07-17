/**
 * The unified official-pricing model — PSA and DTI reference data, plus the
 * user's own verifications/receipts from any store they actually shop at
 * (not limited to SM). These are Philippine government commodity
 * references, legally public data, but a "reference" is not a checkout
 * price and must never be presented as one — see
 * CommodityPrice.isExactStorePrice below.
 */

export type PriceSource =
  | "psa-openstat"
  | "psa-price-situationer"
  | "dti-epresyo"
  | "user-verified"
  | "receipt";

/**
 * Fallback labels for when a store name isn't available. In practice
 * lib/pricing/adapters/user-verified.ts builds a more specific
 * "Verified at {store}" / "Last paid at {store}" label per price — these
 * are just the generic defaults.
 */
export const PRICE_SOURCE_LABELS: Record<PriceSource, string> = {
  "psa-openstat": "Official market reference",
  "psa-price-situationer": "Official market reference",
  "dti-epresyo": "DTI prevailing price",
  "user-verified": "Verified in-store",
  receipt: "Last paid price",
};

export type CommodityUnit = "g" | "kg" | "ml" | "L" | "piece" | "pack" | "can";

export interface CommodityPrice {
  id: string;
  canonicalIngredientKey: string;

  displayName: string;
  commodityName: string;

  amount: number;
  unit: CommodityUnit;

  pricePhp: number;
  pricePerKgPhp?: number;
  pricePerLiterPhp?: number;

  source: PriceSource;
  sourceLabel: string;
  sourceUrl?: string;

  region?: string;
  province?: string;
  city?: string;
  storeId?: string;
  storeName?: string;

  /** The period this price is reported for, e.g. "2026-06" for a PSA/DTI monthly release. */
  referencePeriod: string;
  fetchedAt: string;
  verifiedAt?: string;

  /**
   * True only for a price tied to one exact product at one exact store
   * (user-verified or receipt). PSA and DTI values are commodity-level
   * references and must always be false here — see
   * lib/pricing/priority.ts's exact-vs-broad enforcement.
   */
  isExactStorePrice: boolean;
  isWeighted: boolean;
}

export interface PriceAdapterParams {
  region?: string;
  province?: string;
  city?: string;
}

export type PriceAdapterStatus = "ok" | "integration-unavailable";

export interface PriceAdapterResult {
  status: PriceAdapterStatus;
  prices: CommodityPrice[];
  /** Always present on a non-"ok" result — surfaced to the user, never silently swallowed. */
  reason?: string;
}

export interface PriceAdapter {
  source: PriceSource;
  fetchPrices(params: PriceAdapterParams): Promise<PriceAdapterResult>;
}
