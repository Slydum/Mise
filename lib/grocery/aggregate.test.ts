import { describe, expect, it } from "vitest";
import { aggregateIngredients, filterOutPantryItems, scaleUsage, type AggregateEntry } from "@/lib/grocery/aggregate";
import type { Ingredient } from "@/lib/types";

function ingredient(overrides: Partial<Ingredient>): Ingredient {
  return {
    id: "test-ingredient",
    name: "Onion",
    amount: 1,
    unit: "",
    category: "produce",
    ...overrides,
  };
}

describe("scaleUsage", () => {
  it("multiplies the amount by the ratio", () => {
    const scaled = scaleUsage(ingredient({ amount: 80, unit: "g" }), 1.5);
    expect(scaled.amount).toBe(120);
  });

  it("leaves the ratio-1 case unchanged", () => {
    const scaled = scaleUsage(ingredient({ amount: 3 }), 1);
    expect(scaled.amount).toBe(3);
  });
});

describe("aggregateIngredients", () => {
  it("combines the same plain ingredient across three recipes into one line", () => {
    const entries: AggregateEntry[] = [
      { ingredient: ingredient({ id: "a", name: "Onion", amount: 1, unit: "" }), servingsRatio: 1 },
      { ingredient: ingredient({ id: "b", name: "Onion", amount: 2, unit: "" }), servingsRatio: 1 },
      { ingredient: ingredient({ id: "c", name: "onion", amount: 1, unit: "" }), servingsRatio: 1 },
    ];
    const lines = aggregateIngredients(entries);
    expect(lines).toHaveLength(1);
    expect(lines[0].canonicalKey).toBe("onion");
    expect(lines[0].amount).toBe(4);
  });

  it("converts compatible metric units before summing", () => {
    const entries: AggregateEntry[] = [
      { ingredient: ingredient({ id: "a", name: "Rice", amount: 200, unit: "g", category: "grains" }), servingsRatio: 1 },
      { ingredient: ingredient({ id: "b", name: "Rice", amount: 0.5, unit: "kg", category: "grains" }), servingsRatio: 1 },
    ];
    const lines = aggregateIngredients(entries);
    expect(lines).toHaveLength(1);
    expect(lines[0].baseUnit).toBe("g");
    expect(lines[0].amount).toBe(700);
  });

  it("applies the servings ratio before merging", () => {
    const entries: AggregateEntry[] = [
      { ingredient: ingredient({ id: "a", name: "Garlic", amount: 2, unit: "clove" }), servingsRatio: 2 },
      { ingredient: ingredient({ id: "b", name: "Garlic", amount: 1, unit: "clove" }), servingsRatio: 1 },
    ];
    const lines = aggregateIngredients(entries);
    expect(lines[0].amount).toBe(5); // (2*2) + (1*1)
  });

  it("keeps different discrete units for the same ingredient as separate lines", () => {
    const entries: AggregateEntry[] = [
      { ingredient: ingredient({ id: "a", name: "Garlic", amount: 2, unit: "clove" }), servingsRatio: 1 },
      { ingredient: ingredient({ id: "b", name: "Garlic", amount: 1, unit: "tbsp" }), servingsRatio: 1 },
    ];
    const lines = aggregateIngredients(entries);
    expect(lines).toHaveLength(2);
  });

  it("keeps 'red onion' separate from 'onion'", () => {
    const entries: AggregateEntry[] = [
      { ingredient: ingredient({ id: "a", name: "Red onion", amount: 1, unit: "" }), servingsRatio: 1 },
      { ingredient: ingredient({ id: "b", name: "Onion", amount: 1, unit: "" }), servingsRatio: 1 },
    ];
    const lines = aggregateIngredients(entries);
    expect(lines).toHaveLength(2);
  });
});

describe("filterOutPantryItems", () => {
  it("removes items whose canonical key is in the pantry", () => {
    const lines = aggregateIngredients([
      { ingredient: ingredient({ id: "a", name: "Onion" }), servingsRatio: 1 },
      { ingredient: ingredient({ id: "b", name: "Garlic", unit: "clove", amount: 2 }), servingsRatio: 1 },
    ]);
    const result = filterOutPantryItems(lines, ["Onions"]);
    expect(result).toHaveLength(1);
    expect(result[0].canonicalKey).toBe("garlic");
  });

  it("leaves the list untouched when nothing matches", () => {
    const lines = aggregateIngredients([{ ingredient: ingredient({ name: "Onion" }), servingsRatio: 1 }]);
    expect(filterOutPantryItems(lines, ["Flour"])).toHaveLength(1);
  });
});
