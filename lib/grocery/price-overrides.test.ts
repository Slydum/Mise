import { describe, expect, it } from "vitest";
import { overrideId, resolvePrice, type PriceOverride, type SeededPrice } from "@/lib/grocery/price-overrides";

const seeded: SeededPrice = { pricePhp: 35, priceSource: "manual-sm", lastUpdatedAt: "2026-06-20" };

function override(overrides: Partial<PriceOverride>): PriceOverride {
  return {
    id: "test-override",
    canonicalKey: "canned tuna",
    pricePhp: 40,
    priceSource: "manual-sm",
    updatedAt: "2026-07-01",
    ...overrides,
  };
}

describe("resolvePrice", () => {
  it("returns undefined when there's no override and no seeded price — a genuinely unpriced ingredient", () => {
    expect(resolvePrice("dragonfruit", {}, [])).toBeUndefined();
  });

  it("falls back to the seeded SM package price when there's no override", () => {
    const resolved = resolvePrice("canned tuna", { packageAmount: 1, packageUnit: "can" }, [], seeded);
    expect(resolved).toEqual({ pricePhp: 35, priceSource: "manual-sm", branch: undefined, priceUpdatedAt: "2026-06-20" });
  });

  it("a user-entered actual price outranks the seeded catalog price", () => {
    const resolved = resolvePrice(
      "canned tuna",
      { packageAmount: 1, packageUnit: "can" },
      [override({ pricePhp: 42, priceSource: "manual-sm" })],
      seeded,
    );
    expect(resolved?.pricePhp).toBe(42);
  });

  it("a user-entered actual price outranks a receipt price, even an older one outranks a newer receipt", () => {
    const overrides = [
      override({ id: "receipt-1", priceSource: "receipt", pricePhp: 38, updatedAt: "2026-07-10" }),
      override({ id: "manual-1", priceSource: "manual-sm", pricePhp: 41, updatedAt: "2026-06-25" }),
    ];
    const resolved = resolvePrice("canned tuna", {}, overrides, seeded);
    expect(resolved?.pricePhp).toBe(41);
    expect(resolved?.priceSource).toBe("manual-sm");
  });

  it("a receipt price outranks the seeded catalog price when there's no manual override", () => {
    const resolved = resolvePrice(
      "canned tuna",
      {},
      [override({ priceSource: "receipt", pricePhp: 33 })],
      seeded,
    );
    expect(resolved?.pricePhp).toBe(33);
    expect(resolved?.priceSource).toBe("receipt");
  });

  it("prefers the most recently updated override within the same source tier", () => {
    const overrides = [
      override({ id: "a", pricePhp: 39, updatedAt: "2026-06-01" }),
      override({ id: "b", pricePhp: 44, updatedAt: "2026-07-05" }),
    ];
    expect(resolvePrice("canned tuna", {}, overrides)?.pricePhp).toBe(44);
  });

  it("a package-size-specific override does not apply to a different package size", () => {
    const overrides = [
      override({ pricePhp: 999, packageAmount: 1, packageUnit: "can" }), // sized for a single can
    ];
    // Looking up a 6-pack of the same ingredient shouldn't see the single-can override.
    const resolved = resolvePrice("canned tuna", { packageAmount: 6, packageUnit: "can" }, overrides, seeded);
    expect(resolved?.pricePhp).toBe(seeded.pricePhp);
  });

  it("a branch-specific override only applies when the branch matches", () => {
    const overrides = [override({ pricePhp: 45, branch: "SM Fairview" })];

    const matched = resolvePrice("canned tuna", { branch: "SM Fairview" }, overrides, seeded);
    expect(matched?.pricePhp).toBe(45);
    expect(matched?.branch).toBe("SM Fairview");

    const unmatched = resolvePrice("canned tuna", { branch: "SM North EDSA" }, overrides, seeded);
    expect(unmatched?.pricePhp).toBe(seeded.pricePhp);

    const noBranch = resolvePrice("canned tuna", {}, overrides, seeded);
    expect(noBranch?.pricePhp).toBe(seeded.pricePhp);
  });

  it("a general (branch-agnostic, package-agnostic) override still applies when a branch is given", () => {
    const overrides = [override({ pricePhp: 37 })];
    const resolved = resolvePrice("canned tuna", { branch: "SM Fairview", packageAmount: 1, packageUnit: "can" }, overrides, seeded);
    expect(resolved?.pricePhp).toBe(37);
  });
});

describe("overrideId", () => {
  it("is deterministic for the same match context", () => {
    const a = overrideId("onion", { packageAmount: 1, packageUnit: "piece" });
    const b = overrideId("onion", { packageAmount: 1, packageUnit: "piece" });
    expect(a).toBe(b);
  });

  it("differs across canonical keys, package sizes, or branches", () => {
    const base = overrideId("onion", { packageAmount: 1, packageUnit: "piece" });
    expect(overrideId("garlic", { packageAmount: 1, packageUnit: "piece" })).not.toBe(base);
    expect(overrideId("onion", { packageAmount: 2, packageUnit: "piece" })).not.toBe(base);
    expect(overrideId("onion", { packageAmount: 1, packageUnit: "piece", branch: "SM Fairview" })).not.toBe(base);
  });
});
