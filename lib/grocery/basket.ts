import type { GroceryItem, LivePriceStatus } from "@/lib/types";

export interface BasketSummary {
  /** Sum of liveTotalPricePhp across items with a live/recently-checked price. Always 0 until a real SM adapter exists. */
  liveTotalPhp: number;
  livePricedCount: number;
  /** Items with no live price — the overwhelming majority today, since there is no live SM integration. */
  unavailableCount: number;
  totalItems: number;
  /** True only when every item has a live price. Never true today. */
  isLiveComplete: boolean;
  budgetPhp: number;
  /** null when there's no live total to meaningfully compare against a budget — never show a budget delta against a fabricated or partial total. */
  budgetDeltaPhp: number | null;
}

/**
 * Sums only *live* checkout costs (see GroceryItem.liveTotalPricePhp) —
 * never a user's historical last-paid price, which would misrepresent an
 * old price as today's cost (see lib/grocery/purchase-history.ts). Because
 * Mise has no live SM Markets integration, this total is always ₱0 with
 * every item unavailable — that's the honest, correct state, not a bug.
 */
export function summarizeBasket(items: GroceryItem[], weeklyBudgetPhp: number): BasketSummary {
  let liveTotalPhp = 0;
  let livePricedCount = 0;

  for (const item of items) {
    const isLiveish = item.livePriceStatus === "live" || item.livePriceStatus === "recently-checked";
    if (isLiveish && item.liveTotalPricePhp !== undefined) {
      liveTotalPhp += item.liveTotalPricePhp;
      livePricedCount += 1;
    }
  }

  const totalItems = items.length;
  const unavailableCount = totalItems - livePricedCount;

  return {
    liveTotalPhp,
    livePricedCount,
    unavailableCount,
    totalItems,
    isLiveComplete: totalItems > 0 && livePricedCount === totalItems,
    budgetPhp: weeklyBudgetPhp,
    budgetDeltaPhp: livePricedCount > 0 ? weeklyBudgetPhp - liveTotalPhp : null,
  };
}

export type BasketStatus = "live" | "recently-checked" | "partially-available" | "refresh-required" | "unavailable";

/**
 * The status-driven label for the Grocery summary card (Live SM basket /
 * Recently checked SM basket / Partially available / Refresh required /
 * Live prices unavailable). Derived purely from each item's
 * `livePriceStatus` — since that's always "unavailable" today, this always
 * resolves to "unavailable", which is the correct, honest state.
 */
export function deriveBasketStatus(items: GroceryItem[]): BasketStatus {
  if (items.length === 0) return "unavailable";

  const statuses = new Set<LivePriceStatus>(items.map((i) => i.livePriceStatus));
  const onlyHas = (...allowed: LivePriceStatus[]) => [...statuses].every((s) => allowed.includes(s));
  const hasAny = (...target: LivePriceStatus[]) => target.some((s) => statuses.has(s));

  if (onlyHas("live")) return "live";
  if (onlyHas("live", "recently-checked")) return "recently-checked";
  if (hasAny("live", "recently-checked")) return "partially-available";
  if (hasAny("refresh-required")) return "refresh-required";
  return "unavailable";
}
