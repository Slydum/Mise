import { describe, expect, it } from "vitest";
import { aggregateIngredients } from "@/lib/grocery/aggregate";
import { buildGroceryItems, roundToPracticalAmount, selectPurchase } from "@/lib/grocery/packages";
import type { UsageLine } from "@/lib/grocery/aggregate";
import type { PriceOverride } from "@/lib/grocery/price-overrides";
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
    expect(result.pricePhp).toBeUndefined();
    expect(result.purchaseAmount).toBe(500);
  });

  it("matches a package explicitly mapped to a discrete usage unit (tbsp), not the metric size it's derived from", () => {
    const result = selectPurchase("soy sauce", 5, "tbsp");
    expect(result.packageForm).toBe("bottle");
    expect(result.packageCount).toBe(1); // 5 tbsp needed, one ~13-tbsp bottle covers it
    expect(result.pricePhp).toBe(18);
  });
});

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

  it("prices a single-package purchase", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "canned tuna", displayName: "Canned tuna", amount: 1, baseUnit: "can" }),
    ]);
    expect(item.packageCount).toBe(1);
    expect(item.estimatedPackagePricePhp).toBe(35);
    expect(item.estimatedTotalPricePhp).toBe(35);
  });

  it("prices a multiple-package purchase as packageCount * price-per-package", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "canned tuna", displayName: "Canned tuna", amount: 3, baseUnit: "can" }),
    ]);
    expect(item.packageCount).toBe(3);
    expect(item.estimatedPackagePricePhp).toBe(35);
    expect(item.estimatedTotalPricePhp).toBe(105);
  });

  it("rounds the package count up rather than charging for a fractional package", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "chicken thigh", displayName: "Chicken thighs", amount: 2500, baseUnit: "g" }),
    ]);
    expect(item.packageCount).toBe(3); // ceil(2500/1000)
    expect(item.estimatedTotalPricePhp).toBe(630); // 3 * 210
  });

  it("charges for the whole package bought, not the proportional value of what's used (usage vs. checkout cost)", () => {
    // Recipe needs 400 g of chicken thighs; SM sells a 1 kg pack at ₱210.
    // Usage-proportional cost would be ₱84 — checkout cost is the full ₱210.
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "chicken thigh", displayName: "Chicken thighs", amount: 400, baseUnit: "g" }),
    ]);
    expect(item.usageAmount).toBe(400);
    expect(item.estimatedTotalPricePhp).toBe(210);
    expect(item.estimatedTotalPricePhp).not.toBe(84);
  });

  it("shows no price for an ingredient with no unit-compatible package — needs confirmation, not ₱0", () => {
    const [item] = buildGroceryItems([
      usageLine({ canonicalKey: "onion", displayName: "Onion", amount: 500, baseUnit: "g" }),
    ]);
    expect(item.estimatedPackagePricePhp).toBeUndefined();
    expect(item.estimatedTotalPricePhp).toBeUndefined();
  });

  it("applies a manual price override over the seeded catalog price", () => {
    const overrides: PriceOverride[] = [
      {
        id: "override-1",
        canonicalKey: "canned tuna",
        pricePhp: 42,
        priceSource: "manual-sm",
        packageAmount: 1,
        packageUnit: "can",
        updatedAt: "2026-07-10",
      },
    ];
    const [item] = buildGroceryItems(
      [usageLine({ canonicalKey: "canned tuna", displayName: "Canned tuna", amount: 2, baseUnit: "can" })],
      overrides,
    );
    expect(item.estimatedPackagePricePhp).toBe(42);
    expect(item.estimatedTotalPricePhp).toBe(84); // 2 packages * the corrected price
    expect(item.priceSource).toBe("manual-sm");
    expect(item.priceUpdatedAt).toBe("2026-07-10");
  });

  it("scales priced quantities by the servings ratio before purchase/price selection", () => {
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
    expect(item.estimatedTotalPricePhp).toBe(210);
  });
});
