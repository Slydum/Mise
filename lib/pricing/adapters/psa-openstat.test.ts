import { describe, expect, it } from "vitest";
import { normalizeToPerKgOrLiter, psaOpenStatAdapter } from "@/lib/pricing/adapters/psa-openstat";

describe("psaOpenStatAdapter", () => {
  it("never fabricates data — always reports integration-unavailable with an empty result", async () => {
    const result = await psaOpenStatAdapter.fetchPrices({ city: "Imus" });
    expect(result.status).toBe("integration-unavailable");
    expect(result.prices).toEqual([]);
    expect(result.reason).toBeTruthy();
  });
});

describe("normalizeToPerKgOrLiter", () => {
  it("passes a kg price through unchanged", () => {
    expect(normalizeToPerKgOrLiter(1, "kg", 90)).toBe(90);
  });

  it("scales a gram price up to its per-kg rate", () => {
    expect(normalizeToPerKgOrLiter(500, "g", 45)).toBe(90);
  });

  it("passes a liter price through unchanged", () => {
    expect(normalizeToPerKgOrLiter(1, "L", 95)).toBe(95);
  });

  it("scales a milliliter price up to its per-liter rate", () => {
    expect(normalizeToPerKgOrLiter(250, "ml", 25)).toBe(100);
  });
});
