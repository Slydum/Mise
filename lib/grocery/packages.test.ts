import { describe, expect, it } from "vitest";
import { buildGroceryItems, roundToPracticalAmount, selectPurchase } from "@/lib/grocery/packages";
import type { UsageLine } from "@/lib/grocery/aggregate";

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
});
