import type { GroceryItem } from "@/lib/types";

export interface BasketSummary {
  /** Sum of lineTotalPhp for exact-price items (receipt, user-verified, dti-epresyo). */
  exactTotalPhp: number;
  /** Sum of lineTotalPhp for PSA market-reference items — an expected/usage cost, not a guaranteed checkout price. */
  referenceTotalPhp: number;
  /** exactTotalPhp + referenceTotalPhp — the number to show as "Projected basket" unless isFullyVerifiedAtStore. */
  projectedTotalPhp: number;
  pricedCount: number;
  unavailableCount: number;
  totalItems: number;
  /** True only when every item is priced, none are PSA references, and every exact price was confirmed/paid at the given store — see describeBasketOutlook. */
  isFullyVerifiedAtStore: boolean;
  budgetPhp: number;
  /** null when nothing is priced yet — never compare a budget against a fabricated or empty total. */
  budgetDeltaPhp: number | null;
}

/**
 * Splits the basket into exact prices (receipt/user-verified/dti — genuine
 * checkout costs) and PSA market references (expected-cost estimates), per
 * GROCERY UI's "Exact and receipt prices" / "Official market references"
 * breakdown. Never sums a value for an item with no priceInfo — that's
 * "Price unavailable," not ₱0.
 */
export function summarizeBasket(items: GroceryItem[], weeklyBudgetPhp: number, storeId: string | null): BasketSummary {
  let exactTotalPhp = 0;
  let referenceTotalPhp = 0;
  let pricedCount = 0;
  let allExactAtStore = true;

  for (const item of items) {
    if (!item.priceInfo) continue;
    pricedCount += 1;

    if (item.priceInfo.isUsageReference) {
      referenceTotalPhp += item.priceInfo.lineTotalPhp;
      allExactAtStore = false;
      continue;
    }

    exactTotalPhp += item.priceInfo.lineTotalPhp;
    const source = item.priceInfo.price.source;
    const isVerifiedAtStore =
      (source === "receipt" || source === "user-verified") && item.priceInfo.price.storeId === storeId;
    if (!isVerifiedAtStore) allExactAtStore = false;
  }

  const totalItems = items.length;
  const unavailableCount = totalItems - pricedCount;
  const projectedTotalPhp = exactTotalPhp + referenceTotalPhp;

  return {
    exactTotalPhp,
    referenceTotalPhp,
    projectedTotalPhp,
    pricedCount,
    unavailableCount,
    totalItems,
    isFullyVerifiedAtStore: totalItems > 0 && unavailableCount === 0 && allExactAtStore,
    budgetPhp: weeklyBudgetPhp,
    budgetDeltaPhp: pricedCount > 0 ? weeklyBudgetPhp - projectedTotalPhp : null,
  };
}

export type BasketOutlook = "verified" | "projected" | "unavailable";

/**
 * "Verified basket" only when every included price was confirmed/paid at
 * the current store; "Projected basket" once exact prices and/or PSA
 * references combine; "unavailable" when nothing is priced at all.
 */
export function describeBasketOutlook(summary: BasketSummary): BasketOutlook {
  if (summary.pricedCount === 0) return "unavailable";
  if (summary.isFullyVerifiedAtStore) return "verified";
  return "projected";
}
