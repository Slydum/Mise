import type { GroceryItem } from "@/lib/types";

export interface BasketSummary {
  /** Sum of estimatedTotalPricePhp across every priced item — checked and unchecked alike. */
  totalPhp: number;
  pricedCount: number;
  unpricedCount: number;
  /** False when at least one item has no known price — the total is an incomplete estimate. */
  isComplete: boolean;
  budgetPhp: number;
  /** budgetPhp - totalPhp: positive means under budget, negative means over. */
  budgetDeltaPhp: number;
  mostRecentPriceUpdatedAt?: string;
}

/**
 * Sums the estimated checkout cost of a grocery list against a weekly
 * budget. Items without a resolved price (see lib/grocery/price-overrides.ts)
 * are counted but excluded from the total rather than treated as ₱0, so a
 * manually-added item with no price yet can't silently understate the
 * estimate.
 */
export function summarizeBasket(items: GroceryItem[], weeklyBudgetPhp: number): BasketSummary {
  let totalPhp = 0;
  let pricedCount = 0;
  let unpricedCount = 0;
  let mostRecentPriceUpdatedAt: string | undefined;

  for (const item of items) {
    if (item.estimatedTotalPricePhp !== undefined) {
      totalPhp += item.estimatedTotalPricePhp;
      pricedCount += 1;
      if (item.priceUpdatedAt && (!mostRecentPriceUpdatedAt || item.priceUpdatedAt > mostRecentPriceUpdatedAt)) {
        mostRecentPriceUpdatedAt = item.priceUpdatedAt;
      }
    } else {
      unpricedCount += 1;
    }
  }

  return {
    totalPhp,
    pricedCount,
    unpricedCount,
    isComplete: unpricedCount === 0,
    budgetPhp: weeklyBudgetPhp,
    budgetDeltaPhp: weeklyBudgetPhp - totalPhp,
    mostRecentPriceUpdatedAt,
  };
}

const FRESHNESS_THRESHOLD_DAYS = 45;

/** Whether the most recently updated price in the basket is recent enough to call "updated recently" in the UI. */
export function isPricingFresh(mostRecentPriceUpdatedAt: string | undefined, now: Date = new Date()): boolean {
  if (!mostRecentPriceUpdatedAt) return false;
  const updated = new Date(mostRecentPriceUpdatedAt).getTime();
  const diffDays = (now.getTime() - updated) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= FRESHNESS_THRESHOLD_DAYS;
}
