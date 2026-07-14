import { describe, expect, it } from "vitest";
import { isPricingFresh, summarizeBasket } from "@/lib/grocery/basket";
import type { GroceryItem } from "@/lib/types";

function item(overrides: Partial<GroceryItem>): GroceryItem {
  return {
    id: "gen-item",
    name: "Item",
    amount: 1,
    unit: "piece",
    category: "produce",
    ...overrides,
  };
}

describe("summarizeBasket", () => {
  it("sums estimated line totals across priced items, checked and unchecked alike", () => {
    const items = [
      item({ id: "a", estimatedTotalPricePhp: 1200 }),
      item({ id: "b", estimatedTotalPricePhp: 800 }),
    ];
    expect(summarizeBasket(items, 3000).totalPhp).toBe(2000);
  });

  it("excludes items with no resolved price from the total instead of treating them as ₱0", () => {
    const items = [item({ id: "a", estimatedTotalPricePhp: 500 }), item({ id: "b" })];
    const summary = summarizeBasket(items, 3000);
    expect(summary.totalPhp).toBe(500);
    expect(summary.pricedCount).toBe(1);
    expect(summary.unpricedCount).toBe(1);
    expect(summary.isComplete).toBe(false);
  });

  it("a manually-added item without a price doesn't affect the total", () => {
    const items = [item({ id: "extra-manual-1", name: "Napkins", estimatedTotalPricePhp: undefined })];
    expect(summarizeBasket(items, 3000).totalPhp).toBe(0);
  });

  it("reports under budget when the total is below the weekly budget", () => {
    const items = [item({ estimatedTotalPricePhp: 2485 })];
    const summary = summarizeBasket(items, 3000);
    expect(summary.budgetDeltaPhp).toBe(515);
  });

  it("reports over budget when the total exceeds the weekly budget", () => {
    const items = [item({ estimatedTotalPricePhp: 3600 })];
    const summary = summarizeBasket(items, 3000);
    expect(summary.budgetDeltaPhp).toBe(-600);
  });

  it("is complete when every item has a price", () => {
    const items = [item({ id: "a", estimatedTotalPricePhp: 100 }), item({ id: "b", estimatedTotalPricePhp: 200 })];
    expect(summarizeBasket(items, 3000).isComplete).toBe(true);
  });

  it("tracks the most recently updated price across the basket", () => {
    const items = [
      item({ id: "a", estimatedTotalPricePhp: 100, priceUpdatedAt: "2026-06-01" }),
      item({ id: "b", estimatedTotalPricePhp: 200, priceUpdatedAt: "2026-07-10" }),
    ];
    expect(summarizeBasket(items, 3000).mostRecentPriceUpdatedAt).toBe("2026-07-10");
  });
});

describe("isPricingFresh", () => {
  const now = new Date("2026-07-14T00:00:00Z");

  it("is fresh within the freshness window", () => {
    expect(isPricingFresh("2026-06-20", now)).toBe(true);
  });

  it("is stale outside the freshness window", () => {
    expect(isPricingFresh("2026-01-01", now)).toBe(false);
  });

  it("is not fresh when there's no price at all", () => {
    expect(isPricingFresh(undefined, now)).toBe(false);
  });
});
