import { describe, expect, it } from "vitest";
import { purchaseRecordToCommodityPrice, purchaseRecordsToCommodityPrices } from "@/lib/pricing/adapters/user-verified";
import type { PurchaseRecord } from "@/lib/grocery/purchase-history";

function record(overrides: Partial<PurchaseRecord>): PurchaseRecord {
  return {
    id: "r1",
    canonicalKey: "canned tuna",
    storeId: "sm-fairview",
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

  it("stamps verifiedAt only for a user-verified-sm record, not for a receipt", () => {
    const verified = purchaseRecordToCommodityPrice(record({ source: "user-verified-sm", purchasedAt: "2026-07-10T00:00:00Z" }), "Canned tuna");
    const receipt = purchaseRecordToCommodityPrice(record({ source: "receipt" }), "Canned tuna");
    expect(verified.verifiedAt).toBe("2026-07-10T00:00:00Z");
    expect(receipt.verifiedAt).toBeUndefined();
  });

  it("carries the correct sourceLabel for each kind", () => {
    expect(purchaseRecordToCommodityPrice(record({ source: "receipt" }), "x").sourceLabel).toBe("Last paid at SM");
    expect(purchaseRecordToCommodityPrice(record({ source: "user-verified-sm" }), "x").sourceLabel).toBe("Verified at SM");
  });
});

describe("purchaseRecordsToCommodityPrices", () => {
  it("resolves a display name for each record via the provided lookup", () => {
    const [commodity] = purchaseRecordsToCommodityPrices([record({})], (key) => `Display: ${key}`);
    expect(commodity.displayName).toBe("Display: canned tuna");
  });
});
