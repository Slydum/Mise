import { describe, expect, it } from "vitest";
import { classifyPriceFreshness } from "@/lib/pricing/freshness";
import type { CommodityPrice } from "@/lib/pricing/types";

const now = new Date("2026-07-14T12:00:00Z");

function price(overrides: Partial<CommodityPrice>): CommodityPrice {
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

describe("classifyPriceFreshness", () => {
  it("a user-verified SM price is fresh within 7 days of verification", () => {
    const p = price({ source: "user-verified-sm", verifiedAt: "2026-07-10T00:00:00Z" });
    expect(classifyPriceFreshness(p, now)).toBe("fresh");
  });

  it("a user-verified SM price is stale past 7 days", () => {
    const p = price({ source: "user-verified-sm", verifiedAt: "2026-06-20T00:00:00Z" });
    expect(classifyPriceFreshness(p, now)).toBe("stale");
  });

  it("a receipt price is recent within 14 days", () => {
    const p = price({ source: "receipt", fetchedAt: "2026-07-05T00:00:00Z" });
    expect(classifyPriceFreshness(p, now)).toBe("recent");
  });

  it("a receipt price is stale (historical) past 14 days", () => {
    const p = price({ source: "receipt", fetchedAt: "2026-06-01T00:00:00Z" });
    expect(classifyPriceFreshness(p, now)).toBe("stale");
  });

  it("a DTI price is fresh within its reference period", () => {
    const p = price({ source: "dti-epresyo", referencePeriod: "2026-07" });
    expect(classifyPriceFreshness(p, now)).toBe("fresh");
  });

  it("a DTI price is recent (not stale) once its reference period has passed", () => {
    const p = price({ source: "dti-epresyo", referencePeriod: "2026-01" });
    expect(classifyPriceFreshness(p, now)).toBe("recent");
  });

  it("a Price Situationer figure follows the same reference-period rule as DTI", () => {
    const fresh = price({ source: "psa-price-situationer", referencePeriod: "2026-07" });
    const old = price({ source: "psa-price-situationer", referencePeriod: "2026-01" });
    expect(classifyPriceFreshness(fresh, now)).toBe("fresh");
    expect(classifyPriceFreshness(old, now)).toBe("recent");
  });

  it("PSA OpenSTAT is always 'recent' — it stays best-available until superseded by a newer period, not a calendar cutoff", () => {
    const veryOld = price({ source: "psa-openstat", referencePeriod: "2020-01" });
    expect(classifyPriceFreshness(veryOld, now)).toBe("recent");
  });

  it("different sources use genuinely different rules for the same age", () => {
    const tenDaysAgo = "2026-07-04T00:00:00Z";
    const verified = classifyPriceFreshness(price({ source: "user-verified-sm", verifiedAt: tenDaysAgo }), now);
    const receipt = classifyPriceFreshness(price({ source: "receipt", fetchedAt: tenDaysAgo }), now);
    expect(verified).toBe("stale"); // past the 7-day verified window
    expect(receipt).toBe("recent"); // still within the 14-day receipt window
  });
});
