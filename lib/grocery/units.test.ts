import { describe, expect, it } from "vitest";
import { toBaseAmount, unitKindOf } from "@/lib/grocery/units";

describe("unitKindOf", () => {
  it("classifies mass units", () => {
    expect(unitKindOf("g")).toBe("mass");
    expect(unitKindOf("kg")).toBe("mass");
    expect(unitKindOf("Kg")).toBe("mass");
  });

  it("classifies volume units", () => {
    expect(unitKindOf("ml")).toBe("volume");
    expect(unitKindOf("L")).toBe("volume");
    expect(unitKindOf("l")).toBe("volume");
  });

  it("classifies anything else as discrete", () => {
    expect(unitKindOf("clove")).toBe("discrete");
    expect(unitKindOf("tbsp")).toBe("discrete");
    expect(unitKindOf("")).toBe("discrete");
  });
});

describe("toBaseAmount", () => {
  it("passes grams through unchanged", () => {
    expect(toBaseAmount(80, "g")).toEqual({ amount: 80, baseUnit: "g" });
  });

  it("converts kilograms to grams", () => {
    expect(toBaseAmount(1.5, "kg")).toEqual({ amount: 1500, baseUnit: "g" });
  });

  it("passes milliliters through unchanged", () => {
    expect(toBaseAmount(200, "ml")).toEqual({ amount: 200, baseUnit: "ml" });
  });

  it("converts liters to milliliters", () => {
    expect(toBaseAmount(1, "L")).toEqual({ amount: 1000, baseUnit: "ml" });
  });

  it("is case-insensitive", () => {
    expect(toBaseAmount(2, "KG")).toEqual({ amount: 2000, baseUnit: "g" });
  });

  it("leaves discrete units alone", () => {
    expect(toBaseAmount(3, "clove")).toEqual({ amount: 3, baseUnit: "clove" });
  });

  it("falls back to 'piece' for a bare count", () => {
    expect(toBaseAmount(2, "")).toEqual({ amount: 2, baseUnit: "piece" });
  });
});
