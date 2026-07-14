/**
 * Types for a real SM Markets Online integration. None of these are
 * populated in production today — see lib/sm/adapter.ts for why, and
 * README.md for what a real implementation would need. Kept here so the
 * rest of the app (GroceryItem, purchase history, the Grocery UI) can be
 * built against a stable shape and only the adapter needs to change later.
 */

/** A single live product record for one SKU at one exact store, as SM Markets Online would report it. */
export interface SmLiveProduct {
  storeId: string;
  sku: string;
  productName: string;
  brand?: string;

  productUrl: string;
  imageUrl?: string;

  packageAmount?: number;
  packageUnit?: string;
  packageLabel: string;
  packageForm?: string;

  regularPricePhp: number;
  /** Only set when a confirmed active promotion applies — never overwrites regularPricePhp. */
  promotionalPricePhp?: number;
  /** promotionalPricePhp when active, otherwise regularPricePhp. */
  effectivePricePhp: number;

  pricePerKgPhp?: number;
  pricePerLiterPhp?: number;

  isWeighted: boolean;
  estimatedDisplayWeight?: number;
  minimumWeight?: number;
  maximumWeight?: number;

  inStock: boolean;
  stockLabel?: string;

  fetchedAt: string;
  source: "sm-live";
}

/**
 * A persistent, user-confirmed link between a recipe ingredient and an
 * exact SM product SKU. Never inferred silently for consequential
 * substitutions (fresh vs. canned, plain vs. flavored) — see
 * lib/sm/adapter.ts's matching notes.
 */
export interface IngredientProductMapping {
  canonicalIngredientKey: string;
  storeId?: string;

  preferredSku?: string;
  approvedSkus: string[];
  rejectedSkus: string[];

  requiredUnitType: "weight" | "volume" | "piece" | "pack" | "can" | "bottle" | "bunch";

  preferredBrand?: string;
  userConfirmed: boolean;
  updatedAt: string;
}

export type SmAdapterStatus = "ok" | "integration-unavailable" | "not-found" | "rate-limited";

export interface SmAdapterResult<T> {
  status: SmAdapterStatus;
  data?: T;
  /** Always present on a non-"ok" result — surfaced to the user, never silently swallowed. */
  reason?: string;
}
