import type { PriceSource } from "@/lib/pricing/types";

/**
 * The user's own pricing data from any store they actually shop at — either
 * a receipt price (what they paid) or a manual verification (they confirmed
 * this price is currently accurate at that store, without necessarily
 * buying). This is genuinely local, actionable data: no network access
 * needed, unlike the PSA/DTI adapters. Converted into CommodityPrice
 * records by lib/pricing/adapters/user-verified.ts and resolved alongside
 * every other source by lib/pricing/priority.ts, always as
 * history/verification, never silently promoted to "today's official
 * price."
 *
 * Scoped to a store: a price at one store has no bearing on another, so
 * records never leak across storeId. Switching your current store (see
 * ShoppingSettings.currentStoreId) doesn't delete anything — old records
 * stay for history, they just stop contributing to what's shown for the
 * newly current store.
 */
/**
 * "package" — a flat price for a specific package (e.g. "1 can, ₱38").
 * "per-kg"/"per-liter" — a rate for weighed/measured produce (e.g.
 * "₱69/kg" for avocado priced by weight at the till, common at Philippine
 * supermarkets) rather than a fixed per-piece cost. Applies regardless of
 * how much you buy, the same way a PSA per-kg reference does — see
 * lib/pricing/priority.ts's per-unit-rate matching.
 */
export type PurchaseRecordPricingKind = "package" | "per-kg" | "per-liter";

export interface PurchaseRecord {
  /** Deterministic — derived from the match context, so re-logging for the same item/package/store/kind replaces rather than appends. */
  id: string;
  canonicalKey: string;
  storeId: string;
  pricingKind: PurchaseRecordPricingKind;
  /** For "package": the price of one package. For "per-kg"/"per-liter": the rate per kilogram or liter. */
  pricePhp: number;
  /** Which of the two locally-sourced price kinds this is — see lib/pricing/priority.ts's tier 1 (receipt) vs. tier 2 (user-verified). */
  source: Extract<PriceSource, "receipt" | "user-verified">;
  /** Only meaningful for pricingKind "package". */
  packageAmount?: number;
  packageUnit?: string;
  /** What the user says they actually bought — free text, since there's no product catalog to pick from. */
  productLabel?: string;
  purchasedAt: string;
  receiptReference?: string;
}

export interface PurchaseMatchContext {
  pricingKind: PurchaseRecordPricingKind;
  packageAmount?: number;
  packageUnit?: string;
}

/** Deterministic id for a match context, so logging for the same item/package/store/kind replaces the prior record rather than appending. */
export function purchaseRecordId(
  canonicalKey: string,
  storeId: string,
  source: PurchaseRecord["source"],
  context: PurchaseMatchContext,
): string {
  if (context.pricingKind === "per-kg" || context.pricingKind === "per-liter") {
    return `${canonicalKey}::${storeId}::${source}::${context.pricingKind}`;
  }
  return `${canonicalKey}::${storeId}::${source}::${context.packageAmount ?? "any"}::${context.packageUnit ?? "any"}`;
}
