import { describe, expect, it } from "vitest";
import { deriveBasketStatus, summarizeBasket } from "@/lib/grocery/basket";
import type { GroceryItem, LivePriceStatus } from "@/lib/types";

function item(overrides: Partial<GroceryItem>): GroceryItem {
  return {
    id: "gen-item",
    name: "Item",
    amount: 1,
    unit: "piece",
    category: "produce",
    livePriceStatus: "unavailable",
    ...overrides,
  };
}

describe("summarizeBasket", () => {
  it("sums live totals across live-priced items, checked and unchecked alike", () => {
    const items = [
      item({ id: "a", livePriceStatus: "live", liveTotalPricePhp: 1200 }),
      item({ id: "b", livePriceStatus: "live", liveTotalPricePhp: 800 }),
    ];
    expect(summarizeBasket(items, 3000).liveTotalPhp).toBe(2000);
  });

  it("excludes unavailable items from the total instead of treating them as ₱0", () => {
    const items = [item({ id: "a", livePriceStatus: "live", liveTotalPricePhp: 500 }), item({ id: "b" })];
    const summary = summarizeBasket(items, 3000);
    expect(summary.liveTotalPhp).toBe(500);
    expect(summary.livePricedCount).toBe(1);
    expect(summary.unavailableCount).toBe(1);
    expect(summary.isLiveComplete).toBe(false);
  });

  it("never sums a user's lastPaid (historical) price into the live total", () => {
    const items = [item({ id: "a", lastPaidPricePhp: 500, lastPaidAt: "2026-06-01" })];
    const summary = summarizeBasket(items, 3000);
    expect(summary.liveTotalPhp).toBe(0);
    expect(summary.livePricedCount).toBe(0);
    expect(summary.unavailableCount).toBe(1);
  });

  it("a manually-added item without a price doesn't affect the total", () => {
    const items = [item({ id: "extra-manual-1", name: "Napkins" })];
    expect(summarizeBasket(items, 3000).liveTotalPhp).toBe(0);
  });

  it("has no budget delta at all when nothing is live-priced yet — never compares a fabricated total to the budget", () => {
    const items = [item({ id: "a" })];
    expect(summarizeBasket(items, 3000).budgetDeltaPhp).toBeNull();
  });

  it("reports under budget when the live total is below the weekly budget", () => {
    const items = [item({ livePriceStatus: "live", liveTotalPricePhp: 2485 })];
    const summary = summarizeBasket(items, 3000);
    expect(summary.budgetDeltaPhp).toBe(515);
  });

  it("reports over budget when the live total exceeds the weekly budget", () => {
    const items = [item({ livePriceStatus: "live", liveTotalPricePhp: 3600 })];
    const summary = summarizeBasket(items, 3000);
    expect(summary.budgetDeltaPhp).toBe(-600);
  });

  it("is live-complete only when every item has a live price", () => {
    const items = [
      item({ id: "a", livePriceStatus: "live", liveTotalPricePhp: 100 }),
      item({ id: "b", livePriceStatus: "live", liveTotalPricePhp: 200 }),
    ];
    expect(summarizeBasket(items, 3000).isLiveComplete).toBe(true);
  });

  it("today, with no SM adapter connected, is never live-complete for a non-empty basket", () => {
    const items = [item({ id: "a" }), item({ id: "b" })];
    expect(summarizeBasket(items, 3000).isLiveComplete).toBe(false);
    expect(summarizeBasket(items, 3000).liveTotalPhp).toBe(0);
  });
});

describe("deriveBasketStatus", () => {
  function withStatuses(...statuses: LivePriceStatus[]): GroceryItem[] {
    return statuses.map((livePriceStatus, i) => item({ id: `item-${i}`, livePriceStatus }));
  }

  it("is unavailable for an empty basket", () => {
    expect(deriveBasketStatus([])).toBe("unavailable");
  });

  it("is unavailable when every item is unavailable — the honest default with no SM adapter", () => {
    expect(deriveBasketStatus(withStatuses("unavailable", "unavailable"))).toBe("unavailable");
  });

  it("is live when every item is live", () => {
    expect(deriveBasketStatus(withStatuses("live", "live"))).toBe("live");
  });

  it("is recently-checked when items are a live/recently-checked mix with no stale items", () => {
    expect(deriveBasketStatus(withStatuses("live", "recently-checked"))).toBe("recently-checked");
  });

  it("is partially-available when some items are live-ish and some are not", () => {
    expect(deriveBasketStatus(withStatuses("live", "unavailable"))).toBe("partially-available");
  });

  it("is refresh-required when stale items exist but none are live-ish", () => {
    expect(deriveBasketStatus(withStatuses("refresh-required", "unavailable"))).toBe("refresh-required");
  });
});
