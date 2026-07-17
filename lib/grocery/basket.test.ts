import { describe, expect, it } from "vitest";
import { describeBasketOutlook, summarizeBasket } from "@/lib/grocery/basket";
import type { CommodityPrice } from "@/lib/pricing/types";
import type { GroceryItem, GroceryItemPriceInfo } from "@/lib/types";

function commodityPrice(overrides: Partial<CommodityPrice>): CommodityPrice {
  return {
    id: "test-price",
    canonicalIngredientKey: "onion",
    displayName: "Onion",
    commodityName: "Onion, Red",
    amount: 1,
    unit: "kg",
    pricePhp: 90,
    source: "receipt",
    sourceLabel: "Last paid at SM",
    referencePeriod: "2026-07",
    fetchedAt: "2026-07-10T00:00:00Z",
    storeId: "sm-fairview",
    isExactStorePrice: true,
    isWeighted: false,
    ...overrides,
  };
}

function priceInfo(overrides: Partial<GroceryItemPriceInfo>): GroceryItemPriceInfo {
  return {
    price: commodityPrice({}),
    lineTotalPhp: 100,
    isUsageReference: false,
    ...overrides,
  };
}

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
  it("sums exact-price line totals across items, checked and unchecked alike", () => {
    const items = [
      item({ id: "a", priceInfo: priceInfo({ lineTotalPhp: 1200, isUsageReference: false }) }),
      item({ id: "b", priceInfo: priceInfo({ lineTotalPhp: 800, isUsageReference: false }) }),
    ];
    const summary = summarizeBasket(items, 3000, "sm-fairview");
    expect(summary.exactTotalPhp).toBe(2000);
    expect(summary.projectedTotalPhp).toBe(2000);
  });

  it("keeps PSA reference totals in a separate bucket from exact totals", () => {
    const items = [
      item({ id: "a", priceInfo: priceInfo({ lineTotalPhp: 500, isUsageReference: false }) }),
      item({ id: "b", priceInfo: priceInfo({ lineTotalPhp: 300, isUsageReference: true }) }),
    ];
    const summary = summarizeBasket(items, 3000, "sm-fairview");
    expect(summary.exactTotalPhp).toBe(500);
    expect(summary.referenceTotalPhp).toBe(300);
    expect(summary.projectedTotalPhp).toBe(800);
  });

  it("excludes unpriced items from the total instead of treating them as ₱0", () => {
    const items = [item({ id: "a", priceInfo: priceInfo({ lineTotalPhp: 500 }) }), item({ id: "b" })];
    const summary = summarizeBasket(items, 3000, "sm-fairview");
    expect(summary.projectedTotalPhp).toBe(500);
    expect(summary.pricedCount).toBe(1);
    expect(summary.unavailableCount).toBe(1);
  });

  it("has no budget delta at all when nothing is priced yet", () => {
    const items = [item({ id: "a" })];
    expect(summarizeBasket(items, 3000, "sm-fairview").budgetDeltaPhp).toBeNull();
  });

  it("reports under budget when the projected total is below the weekly budget", () => {
    const items = [item({ priceInfo: priceInfo({ lineTotalPhp: 2485 }) })];
    expect(summarizeBasket(items, 3000, "sm-fairview").budgetDeltaPhp).toBe(515);
  });

  it("reports over budget when the projected total exceeds the weekly budget", () => {
    const items = [item({ priceInfo: priceInfo({ lineTotalPhp: 3600 }) })];
    expect(summarizeBasket(items, 3000, "sm-fairview").budgetDeltaPhp).toBe(-600);
  });

  it("is fully verified at store only when every item is an exact SM price confirmed at the given store", () => {
    const items = [
      item({ id: "a", priceInfo: priceInfo({ price: commodityPrice({ source: "receipt", storeId: "sm-fairview" }) }) }),
      item({ id: "b", priceInfo: priceInfo({ price: commodityPrice({ source: "user-verified", storeId: "sm-fairview" }) }) }),
    ];
    expect(summarizeBasket(items, 3000, "sm-fairview").isFullyVerifiedAtStore).toBe(true);
  });

  it("is not fully verified when a DTI or PSA reference is included, even alongside exact SM prices", () => {
    const items = [
      item({ id: "a", priceInfo: priceInfo({ price: commodityPrice({ source: "receipt", storeId: "sm-fairview" }) }) }),
      item({ id: "b", priceInfo: priceInfo({ price: commodityPrice({ source: "dti-epresyo" }), isUsageReference: false }) }),
    ];
    expect(summarizeBasket(items, 3000, "sm-fairview").isFullyVerifiedAtStore).toBe(false);
  });

  it("is not fully verified when an exact price came from a different store", () => {
    const items = [item({ priceInfo: priceInfo({ price: commodityPrice({ source: "receipt", storeId: "sm-north-edsa" }) }) })];
    expect(summarizeBasket(items, 3000, "sm-fairview").isFullyVerifiedAtStore).toBe(false);
  });

  it("is not fully verified when any item is unpriced", () => {
    const items = [
      item({ id: "a", priceInfo: priceInfo({ price: commodityPrice({ source: "receipt", storeId: "sm-fairview" }) }) }),
      item({ id: "b" }),
    ];
    expect(summarizeBasket(items, 3000, "sm-fairview").isFullyVerifiedAtStore).toBe(false);
  });
});

describe("describeBasketOutlook", () => {
  it("is unavailable when nothing is priced", () => {
    const summary = summarizeBasket([item({})], 3000, "sm-fairview");
    expect(describeBasketOutlook(summary)).toBe("unavailable");
  });

  it("is verified when every price is an exact SM price at the current store", () => {
    const items = [item({ priceInfo: priceInfo({ price: commodityPrice({ source: "receipt", storeId: "sm-fairview" }) }) })];
    const summary = summarizeBasket(items, 3000, "sm-fairview");
    expect(describeBasketOutlook(summary)).toBe("verified");
  });

  it("is projected for a mixed-source basket (exact prices plus PSA references)", () => {
    const items = [
      item({ id: "a", priceInfo: priceInfo({ price: commodityPrice({ source: "receipt", storeId: "sm-fairview" }) }) }),
      item({ id: "b", priceInfo: priceInfo({ price: commodityPrice({ source: "psa-openstat" }), isUsageReference: true }) }),
    ];
    const summary = summarizeBasket(items, 3000, "sm-fairview");
    expect(describeBasketOutlook(summary)).toBe("projected");
  });
});
