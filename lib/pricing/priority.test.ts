import { describe, expect, it } from "vitest";
import { resolvePrice, type PriceMatchContext } from "@/lib/pricing/priority";
import type { CommodityPrice } from "@/lib/pricing/types";

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

/** Package-priced sources (receipt/user-verified/dti-epresyo) in these tests are never weighted — only PSA fixtures inherit the default. */
function packagePrice(overrides: Partial<CommodityPrice>): CommodityPrice {
  return price({ isWeighted: false, ...overrides });
}

const context: PriceMatchContext = { canonicalIngredientKey: "onion", packageAmount: 1, packageUnit: "kg", storeId: "sm-fairview" };

describe("resolvePrice", () => {
  it("returns undefined when nothing matches — never fabricates a price", () => {
    expect(resolvePrice(context, [])).toBeUndefined();
  });

  it("a receipt price outranks every other source", () => {
    const candidates = [
      price({ id: "psa", source: "psa-openstat", region: "CALABARZON", pricePhp: 90 }),
      packagePrice({ id: "dti", source: "dti-epresyo", pricePhp: 85, isExactStorePrice: false }),
      packagePrice({ id: "verified", source: "user-verified", pricePhp: 88, storeId: "sm-fairview", isExactStorePrice: true }),
      packagePrice({ id: "receipt", source: "receipt", pricePhp: 92, storeId: "sm-fairview", isExactStorePrice: true }),
    ];
    expect(resolvePrice(context, candidates)?.id).toBe("receipt");
  });

  it("a user-verified SM price outranks DTI and PSA when there's no receipt", () => {
    const candidates = [
      price({ id: "psa", source: "psa-openstat", region: "CALABARZON" }),
      packagePrice({ id: "dti", source: "dti-epresyo" }),
      packagePrice({ id: "verified", source: "user-verified", storeId: "sm-fairview", isExactStorePrice: true }),
    ];
    expect(resolvePrice(context, candidates)?.id).toBe("verified");
  });

  it("DTI outranks every PSA geographic tier", () => {
    const candidates = [
      price({ id: "psa-city", source: "psa-openstat", city: "Imus" }),
      packagePrice({ id: "dti", source: "dti-epresyo" }),
    ];
    expect(resolvePrice(context, candidates)?.id).toBe("dti");
  });

  it("prefers a PSA city reference over province, region, and national", () => {
    const candidates = [
      price({ id: "national", source: "psa-openstat" }),
      price({ id: "region", source: "psa-openstat", region: "CALABARZON" }),
      price({ id: "province", source: "psa-openstat", province: "Cavite" }),
      price({ id: "city", source: "psa-openstat", city: "Imus" }),
    ];
    expect(resolvePrice(context, candidates)?.id).toBe("city");
  });

  it("a package-size-specific receipt does not apply to a different package size", () => {
    const candidates = [packagePrice({ source: "receipt", storeId: "sm-fairview", amount: 6, unit: "kg" })];
    expect(resolvePrice(context, candidates)).toBeUndefined();
  });

  it("a receipt from a different store does not apply to the currently selected store", () => {
    const candidates = [packagePrice({ source: "receipt", storeId: "sm-north-edsa", amount: 1, unit: "kg" })];
    expect(resolvePrice(context, candidates)).toBeUndefined();
  });

  it("DTI matches by package but ignores store — it isn't store-specific", () => {
    const candidates = [packagePrice({ source: "dti-epresyo", amount: 1, unit: "kg", storeId: undefined })];
    expect(resolvePrice(context, candidates)?.source).toBe("dti-epresyo");
  });

  it("PSA references match by commodity only — no package/store required", () => {
    const candidates = [price({ source: "psa-openstat", amount: 5, unit: "kg" })];
    expect(resolvePrice(context, candidates)?.source).toBe("psa-openstat");
  });

  it("never lets a broad PSA/DTI reference resolve with isExactStorePrice true", () => {
    const candidates = [price({ source: "psa-openstat", isExactStorePrice: false })];
    const resolved = resolvePrice(context, candidates);
    expect(resolved?.isExactStorePrice).toBe(false);
  });

  it("prefers the Price Situationer over OpenSTAT at the same geographic tier when at least as recent", () => {
    const candidates = [
      price({ id: "openstat", source: "psa-openstat", region: "CALABARZON", referencePeriod: "2026-06" }),
      price({ id: "situationer", source: "psa-price-situationer", region: "CALABARZON", referencePeriod: "2026-06" }),
    ];
    expect(resolvePrice(context, candidates)?.id).toBe("situationer");
  });

  it("falls back to OpenSTAT when the Situationer's period is older", () => {
    const candidates = [
      price({ id: "openstat", source: "psa-openstat", region: "CALABARZON", referencePeriod: "2026-06" }),
      price({ id: "situationer", source: "psa-price-situationer", region: "CALABARZON", referencePeriod: "2026-03" }),
    ];
    expect(resolvePrice(context, candidates)?.id).toBe("openstat");
  });

  it("preserves the source URL and reference period on the resolved price, unmodified", () => {
    const candidates = [
      packagePrice({
        source: "dti-epresyo",
        sourceUrl: "https://www.dti.gov.ph/konsyumer/e-presyo/",
        referencePeriod: "2026-07",
      }),
    ];
    const resolved = resolvePrice(context, candidates);
    expect(resolved?.sourceUrl).toBe("https://www.dti.gov.ph/konsyumer/e-presyo/");
    expect(resolved?.referencePeriod).toBe("2026-07");
  });

  it("a per-kg receipt rate applies regardless of package size, like a PSA reference", () => {
    const candidates = [packagePrice({ source: "receipt", storeId: "sm-fairview", isWeighted: true, pricePerKgPhp: 69 })];
    const resolved = resolvePrice(context, candidates);
    expect(resolved?.pricePerKgPhp).toBe(69);
  });

  it("a per-kg receipt rate still respects store scoping", () => {
    const candidates = [packagePrice({ source: "receipt", storeId: "sm-north-edsa", isWeighted: true, pricePerKgPhp: 69 })];
    expect(resolvePrice(context, candidates)).toBeUndefined();
  });
});
