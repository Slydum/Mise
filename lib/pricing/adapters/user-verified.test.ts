import { describe, expect, it } from "vitest";
import { purchaseRecordToCommodityPrice, purchaseRecordsToCommodityPrices } from "@/lib/pricing/adapters/user-verified";
import type { PurchaseRecord } from "@/lib/grocery/purchase-history";

function record(overrides: Partial<PurchaseRecord>): PurchaseRecord {
  return {
    id: "r1",
    canonicalKey: "canned tuna",
    storeId: "sm-fairview",
    pricingKind: "package",
    pricePhp: 38,
    source: "receipt",
    purchasedAt: "2026-07-10T00:00:00Z",
    ...overrides,
  };
}

describe("purchaseRecordToCommodityPrice", () => {
  it("is always an exact store price, never a broad reference", () => {
    const commodity = purchaseRecordToCommodityPrice(record({}), "Canned tuna");
    expect(commodity.isExactStorePrice).toBe(true);
  });

  it("preserves the store id and the reference period derived from the purchase date", () => {
    const commodity = purchaseRecordToCommodityPrice(record({ storeId: "sm-north-edsa", purchasedAt: "2026-05-03T00:00:00Z" }), "Canned tuna");
    expect(commodity.storeId).toBe("sm-north-edsa");
    expect(commodity.referencePeriod).toBe("2026-05");
  });

  it("stamps verifiedAt only for a user-verified record, not for a receipt", () => {
    const verified = purchaseRecordToCommodityPrice(record({ source: "user-verified", purchasedAt: "2026-07-10T00:00:00Z" }), "Canned tuna");
    const receipt = purchaseRecordToCommodityPrice(record({ source: "receipt" }), "Canned tuna");
    expect(verified.verifiedAt).toBe("2026-07-10T00:00:00Z");
    expect(receipt.verifiedAt).toBeUndefined();
  });

  it("builds a store-specific sourceLabel when a store name is given", () => {
    expect(purchaseRecordToCommodityPrice(record({ source: "receipt" }), "x", "Puregold Imus").sourceLabel).toBe("Last paid at Puregold Imus");
    expect(purchaseRecordToCommodityPrice(record({ source: "user-verified" }), "x", "SM Supermarket Fairview").sourceLabel).toBe(
      "Verified at SM Supermarket Fairview",
    );
  });

  it("falls back to a generic label when no store name is available", () => {
    expect(purchaseRecordToCommodityPrice(record({ source: "receipt" }), "x").sourceLabel).toBe("Last paid price");
    expect(purchaseRecordToCommodityPrice(record({ source: "user-verified" }), "x").sourceLabel).toBe("Verified in-store");
  });

  it("marks a per-kg record as weighted and populates pricePerKgPhp, not a package price", () => {
    const commodity = purchaseRecordToCommodityPrice(
      record({ pricingKind: "per-kg", pricePhp: 69, packageAmount: undefined, packageUnit: undefined }),
      "Avocado",
    );
    expect(commodity.isWeighted).toBe(true);
    expect(commodity.pricePerKgPhp).toBe(69);
    expect(commodity.pricePerLiterPhp).toBeUndefined();
    expect(commodity.unit).toBe("kg");
    expect(commodity.isExactStorePrice).toBe(true);
  });

  it("marks a per-liter record as weighted and populates pricePerLiterPhp", () => {
    const commodity = purchaseRecordToCommodityPrice(record({ pricingKind: "per-liter", pricePhp: 95 }), "Cooking oil");
    expect(commodity.isWeighted).toBe(true);
    expect(commodity.pricePerLiterPhp).toBe(95);
    expect(commodity.pricePerKgPhp).toBeUndefined();
    expect(commodity.unit).toBe("L");
  });

  it("a package-priced record is never marked weighted", () => {
    expect(purchaseRecordToCommodityPrice(record({ pricingKind: "package" }), "x").isWeighted).toBe(false);
  });
});

describe("purchaseRecordsToCommodityPrices", () => {
  it("resolves a display name and a store name for each record via the provided lookups", () => {
    const [commodity] = purchaseRecordsToCommodityPrices(
      [record({ storeId: "puregold-imus" })],
      (key) => `Display: ${key}`,
      (storeId) => (storeId === "puregold-imus" ? "Puregold Imus" : undefined),
    );
    expect(commodity.displayName).toBe("Display: canned tuna");
    expect(commodity.storeName).toBe("Puregold Imus");
    expect(commodity.sourceLabel).toBe("Last paid at Puregold Imus");
  });

  it("never invents a store name the resolver didn't provide", () => {
    const [commodity] = purchaseRecordsToCommodityPrices([record({})], (key) => key, () => undefined);
    expect(commodity.storeName).toBeUndefined();
  });
});
