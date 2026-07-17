import { describe, expect, it } from "vitest";
import { aggregateIngredients } from "@/lib/grocery/aggregate";
import { buildGroceryItems, roundToPracticalAmount, selectPurchase } from "@/lib/grocery/packages";
import type { UsageLine } from "@/lib/grocery/aggregate";
import type { CommodityPrice } from "@/lib/pricing/types";
import type { Ingredient } from "@/lib/types";

describe("roundToPracticalAmount", () => {
  it("rounds small mass amounts up to the nearest 5", () => {
    expect(roundToPracticalAmount(3, "g")).toBe(5);
    expect(roundToPracticalAmount(22, "g")).toBe(25);
  });

  it("rounds larger mass amounts up to the nearest 50", () => {
    expect(roundToPracticalAmount(120, "g")).toBe(150);
    expect(roundToPracticalAmount(700, "ml")).toBe(700);
  });

  it("rounds discrete/count units up to a whole number", () => {
    expect(roundToPracticalAmount(2.2, "piece")).toBe(3);
  });

  it("returns 0 for a non-positive amount", () => {
    expect(roundToPracticalAmount(0, "g")).toBe(0);
  });
});

describe("selectPurchase", () => {
  it("rounds up to whole packages for a curated ingredient", () => {
    // rice: 1 kg (1000 g) bags, needing 1300 g -> 2 bags
    const result = selectPurchase("rice", 1300, "g");
    expect(result.packageForm).toBe("kilogram");
    expect(result.packageCount).toBe(2);
    expect(result.purchaseAmount).toBe(2000);
  });

  it("buys exactly one package when usage is under a single package size", () => {
    const result = selectPurchase("rice", 400, "g");
    expect(result.packageCount).toBe(1);
    expect(result.purchaseAmount).toBe(1000);
  });

  it("falls back to practical loose rounding for an uncurated ingredient", () => {
    const result = selectPurchase("dragonfruit", 120, "g");
    expect(result.packageForm).toBeUndefined();
    expect(result.purchaseAmount).toBe(150);
  });

  it("converts compatible mass units before comparing against a package (needed in kg, package sized in g)", () => {
    const result = selectPurchase("rice", 1.3, "kg");
    expect(result.packageCount).toBe(2);
    expect(result.purchaseAmount).toBe(2000);
  });

  it("refuses to match a package whose unit is incompatible with the ingredient's usage unit", () => {
    // Onion is curated per-piece; asking for it in grams shouldn't match that package.
    const result = selectPurchase("onion", 500, "g");
    expect(result.packageForm).toBeUndefined();
    expect(result.purchaseAmount).toBe(500);
  });

  it("matches a package explicitly mapped to a discrete usage unit (tbsp), not the metric size it's derived from", () => {
    const result = selectPurchase("soy sauce", 5, "tbsp");
    expect(result.packageForm).toBe("bottle");
    expect(result.packageCount).toBe(1); // 5 tbsp needed, one ~13-tbsp bottle covers it
  });
});

function commodityPrice(overrides: Partial<CommodityPrice>): CommodityPrice {
  return {
    id: "test-price",
    canonicalIngredientKey: "onion",
    displayName: "Onion",
    commodityName: "Onion, Red",
    amount: 1,
    unit: "kg",
    pricePhp: 90,
    source: "psa-openstat",
    sourceLabel: "Official market reference",
    referencePeriod: "2026-06",
    fetchedAt: "2026-06-15T00:00:00Z",
    isExactStorePrice: false,
    isWeighted: true,
    ...overrides,
  };
}

/** Package-priced sources (receipt/user-verified/dti-epresyo) in these tests are never weighted — only PSA fixtures inherit the default. */
function packageCommodityPrice(overrides: Partial<CommodityPrice>): CommodityPrice {
  return commodityPrice({ isWeighted: false, ...overrides });
}

describe("buildGroceryItems", () => {
  function usageLine(overrides: Partial<UsageLine>): UsageLine {
    return {
      canonicalKey: "onion",
      displayName: "Onion",
      amount: 1,
      baseUnit: "piece",
      category: "produce",
      ...overrides,
    };
  }

  it("shows a package form and count for curated ingredients", () => {
    const [item] = buildGroceryItems([usageLine({ canonicalKey: "egg", displayName: "Eggs", amount: 8, baseUnit: "piece" })]);
    expect(item.unit).toBe("tray");
    expect(item.amount).toBe(1); // ceil(8/30)
  });

  it("promotes large loose gram amounts to kilograms", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "dragonfruit", displayName: "Dragonfruit", amount: 1530, baseUnit: "g" }),
    ]);
    expect(item.unit).toBe("kg");
    expect(item.amount).toBe(1.55); // 1530 rounds up to 1550 (nearest 50), then /1000
  });

  it("keeps small loose gram amounts in grams", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "dragonfruit", displayName: "Dragonfruit", amount: 120, baseUnit: "g" }),
    ]);
    expect(item.unit).toBe("g");
    expect(item.amount).toBe(150);
  });

  it("produces a stable, deterministic id per canonical key + unit", () => {
    const [item] = buildGroceryItems([usageLine({ canonicalKey: "spring onion" })]);
    expect(item.id).toBe("gen-spring-onion-piece");
  });

  it("carries the canonical key through onto the grocery item", () => {
    const [item] = buildGroceryItems([usageLine({ canonicalKey: "onion" })]);
    expect(item.canonicalKey).toBe("onion");
  });

  it("preserves the raw usage quantity separately from the rounded-up purchase quantity", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "chicken thigh", displayName: "Chicken thighs", amount: 400, baseUnit: "g" }),
    ]);
    expect(item.usageAmount).toBe(400);
    expect(item.usageUnit).toBe("g");
    expect(item.amount).toBe(1); // packages, not grams
    expect(item.unit).toBe("kilogram");
  });

  it("never fabricates a price — no priceInfo without a matching candidate", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "canned tuna", displayName: "Canned tuna", amount: 3, baseUnit: "can" }),
    ]);
    expect(item.priceInfo).toBeUndefined();
  });

  it("computes an exact checkout cost (packageCount * pricePhp) for a receipt/DTI/user-verified candidate", () => {
    const candidates = [
      packageCommodityPrice({ canonicalIngredientKey: "canned tuna", source: "receipt", storeId: "sm-fairview", amount: 1, unit: "can", pricePhp: 35 }),
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "canned tuna", displayName: "Canned tuna", amount: 3, baseUnit: "can" })],
      "sm-fairview",
      candidates,
    );
    expect(item.priceInfo?.isUsageReference).toBe(false);
    expect(item.priceInfo?.packageCount).toBe(3);
    expect(item.priceInfo?.lineTotalPhp).toBe(105); // 3 packages * 35
  });

  it("computes a usage-reference cost (requiredWeightKg * pricePerKg) for a PSA candidate", () => {
    const candidates = [commodityPrice({ source: "psa-openstat", region: "CALABARZON", pricePerKgPhp: 140 })];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "onion", displayName: "Onion", amount: 1200, baseUnit: "g" })],
      null,
      candidates,
    );
    expect(item.priceInfo?.isUsageReference).toBe(true);
    expect(item.priceInfo?.lineTotalPhp).toBe(168); // 1.2 kg * 140
    expect(item.priceInfo?.packageCount).toBeUndefined();
  });

  it("leaves a PSA reference unresolved when the usage unit has no per-kg/per-liter meaning (e.g. pieces)", () => {
    const candidates = [commodityPrice({ source: "psa-openstat", pricePerKgPhp: 140 })];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "onion", displayName: "Onion", amount: 3, baseUnit: "piece" })],
      null,
      candidates,
    );
    expect(item.priceInfo).toBeUndefined();
  });

  it("never leaks a receipt price from a different store into the current basket", () => {
    const candidates = [
      packageCommodityPrice({ canonicalIngredientKey: "canned tuna", source: "receipt", storeId: "sm-north-edsa", amount: 1, unit: "can" }),
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "canned tuna", displayName: "Canned tuna", amount: 1, baseUnit: "can" })],
      "sm-fairview",
      candidates,
    );
    expect(item.priceInfo).toBeUndefined();
  });

  it("computes a usage-reference cost from a receipt/verified per-kg rate, the same way as a PSA reference", () => {
    const candidates = [
      commodityPrice({
        canonicalIngredientKey: "avocado",
        source: "receipt",
        storeId: "puregold-imus",
        isWeighted: true,
        pricePerKgPhp: 69,
      }),
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "avocado", displayName: "Avocado", amount: 452, baseUnit: "g" })],
      "puregold-imus",
      candidates,
    );
    expect(item.priceInfo?.isUsageReference).toBe(true);
    expect(item.priceInfo?.lineTotalPhp).toBeCloseTo(31.19, 2); // 0.452 kg * 69
  });

  it("a receipt per-kg rate doesn't price a piece-counted usage (no weight to convert)", () => {
    const candidates = [
      commodityPrice({ canonicalIngredientKey: "avocado", source: "receipt", storeId: "puregold-imus", isWeighted: true, pricePerKgPhp: 69 }),
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "avocado", displayName: "Avocado", amount: 1, baseUnit: "piece" })],
      "puregold-imus",
      candidates,
    );
    expect(item.priceInfo).toBeUndefined();
  });

  it("explains why the price is unavailable when only a per-kg rate was logged for a piece-counted item", () => {
    const candidates = [
      commodityPrice({ canonicalIngredientKey: "avocado", source: "receipt", storeId: "puregold-imus", isWeighted: true, pricePerKgPhp: 69 }),
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "avocado", displayName: "Avocado", amount: 4, baseUnit: "piece" })],
      "puregold-imus",
      candidates,
    );
    expect(item.priceInfo).toBeUndefined();
    expect(item.priceUnavailableReason).toMatch(/per-kilogram\/per-liter price was logged/);
  });

  it("falls back to a usable whole-purchase price when the top-ranked match is a per-kg rate that can't convert", () => {
    // Both logged for the same ingredient/store: a per-kg rate (ranks first, same tier,
    // but can't price a piece-counted line) and a whole-purchase price (usable). The
    // line must still get priced from the usable one instead of going unpriced.
    const candidates = [
      commodityPrice({
        id: "per-kg",
        canonicalIngredientKey: "avocado",
        source: "receipt",
        storeId: "puregold-imus",
        isWeighted: true,
        pricePerKgPhp: 69,
        referencePeriod: "2026-07",
      }),
      packageCommodityPrice({
        id: "whole",
        canonicalIngredientKey: "avocado",
        source: "receipt",
        storeId: "puregold-imus",
        amount: 1,
        unit: "piece",
        pricePhp: 31,
        referencePeriod: "2026-07",
      }),
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "avocado", displayName: "Avocado", amount: 4, baseUnit: "piece" })],
      "puregold-imus",
      candidates,
    );
    expect(item.priceInfo?.isUsageReference).toBe(false);
    expect(item.priceInfo?.price.id).toBe("whole");
  });

  it("explains why the price is unavailable when a price was logged for a different package size", () => {
    const candidates = [
      packageCommodityPrice({
        canonicalIngredientKey: "canned tuna",
        source: "receipt",
        storeId: "sm-fairview",
        amount: 2,
        unit: "can",
        pricePhp: 70,
      }),
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "canned tuna", displayName: "Canned tuna", amount: 1, baseUnit: "can" })],
      "sm-fairview",
      candidates,
    );
    expect(item.priceInfo).toBeUndefined();
    expect(item.priceUnavailableReason).toMatch(/not for this exact package/);
  });

  it("sets no reason at all when nothing was ever logged for this ingredient", () => {
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "dragonfruit", displayName: "Dragonfruit", amount: 1, baseUnit: "piece" })],
      "sm-fairview",
      [],
    );
    expect(item.priceInfo).toBeUndefined();
    expect(item.priceUnavailableReason).toBeUndefined();
  });

  it("scales quantities by the servings ratio before purchase selection", () => {
    const chickenThighs: Ingredient = {
      id: "ct",
      name: "Chicken thighs",
      amount: 400,
      unit: "g",
      category: "protein",
    };
    // A household of 6 eating a recipe written for 4 servings: 400g * (6/4) = 600g needed.
    const lines = aggregateIngredients([{ ingredient: chickenThighs, servingsRatio: 6 / 4 }]);
    const [item] = buildGroceryItems(lines);
    expect(item.usageAmount).toBe(600);
    expect(item.packageCount).toBe(1); // still fits in one 1 kg pack
  });
});
