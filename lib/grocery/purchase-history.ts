import type { PriceSource } from "@/lib/pricing/types";

/**
 * The user's own SM pricing data — either a receipt price (what they
 * actually paid) or a manual verification (they confirmed this price is
 * currently accurate at their branch, without necessarily buying). This is
 * genuinely local, actionable data: no network access needed, unlike the
 * PSA/DTI adapters. Converted into CommodityPrice records by
 * lib/pricing/adapters/user-verified.ts and resolved alongside every other
 * source by lib/pricing/priority.ts — see GroceryItem.lastPaidPricePhp for
 * how it's surfaced, always as history/verification, never silently
 * promoted to "today's official price."
 *
 * Scoped to a store: a price at one branch has no bearing on another, so
 * records never leak across storeId. Changing the selected store doesn't
 * delete anything — old records stay for history, they just stop
 * contributing to what's shown as current for the newly selected store.
 */
export interface PurchaseRecord {
  /** Deterministic — derived from the match context, so re-logging for the same item/package/store/kind replaces rather than appends. */
  id: string;
  canonicalKey: string;
  storeId: string;
  pricePhp: number;
  /** Which of the two locally-sourced price kinds this is — see lib/pricing/priority.ts's tier 1 (receipt) vs. tier 2 (user-verified-sm). */
  source: Extract<PriceSource, "receipt" | "user-verified-sm">;
  packageAmount?: number;
  packageUnit?: string;
  /** What the user says they actually bought — free text, since there's no product catalog to pick from. */
  productLabel?: string;
  purchasedAt: string;
  receiptReference?: string;
}

export interface PurchaseMatchContext {
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
  return `${canonicalKey}::${storeId}::${source}::${context.packageAmount ?? "any"}::${context.packageUnit ?? "any"}`;
}
