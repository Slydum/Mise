import { describe, expect, it } from "vitest";
import { purchaseRecordId, resolveLastPaid, type PurchaseRecord } from "@/lib/grocery/purchase-history";

function record(overrides: Partial<PurchaseRecord>): PurchaseRecord {
  return {
    id: "test-record",
    canonicalKey: "canned tuna",
    storeId: "sm-fairview",
    pricePhp: 35,
    purchasedAt: "2026-07-01",
    ...overrides,
  };
}

describe("resolveLastPaid", () => {
  it("returns undefined when nothing has ever been logged — never fabricates a price", () => {
    expect(resolveLastPaid("dragonfruit", "sm-fairview", {}, [])).toBeUndefined();
  });

  it("resolves a matching record for the ingredient at the given store", () => {
    const resolved = resolveLastPaid("canned tuna", "sm-fairview", {}, [record({ pricePhp: 38 })]);
    expect(resolved?.pricePhp).toBe(38);
  });

  it("never leaks a purchase record from one store into another", () => {
    const records = [record({ storeId: "sm-fairview", pricePhp: 38 })];
    expect(resolveLastPaid("canned tuna", "sm-north-edsa", {}, records)).toBeUndefined();
  });

  it("prefers the most recently purchased record when several match", () => {
    const records = [
      record({ id: "a", pricePhp: 33, purchasedAt: "2026-05-01" }),
      record({ id: "b", pricePhp: 40, purchasedAt: "2026-07-10" }),
    ];
    expect(resolveLastPaid("canned tuna", "sm-fairview", {}, records)?.pricePhp).toBe(40);
  });

  it("a package-size-specific record does not apply to a different package size", () => {
    const records = [record({ pricePhp: 999, packageAmount: 1, packageUnit: "can" })];
    const resolved = resolveLastPaid("canned tuna", "sm-fairview", { packageAmount: 6, packageUnit: "can" }, records);
    expect(resolved).toBeUndefined();
  });

  it("a package-specific record outranks a package-agnostic record for the same context", () => {
    const records = [
      record({ id: "general", pricePhp: 30, purchasedAt: "2026-07-05" }),
      record({ id: "specific", pricePhp: 36, packageAmount: 1, packageUnit: "can", purchasedAt: "2026-06-01" }),
    ];
    const resolved = resolveLastPaid("canned tuna", "sm-fairview", { packageAmount: 1, packageUnit: "can" }, records);
    expect(resolved?.pricePhp).toBe(36);
  });
});

describe("purchaseRecordId", () => {
  it("is deterministic for the same ingredient/store/package context", () => {
    const a = purchaseRecordId("onion", "sm-fairview", { packageAmount: 1, packageUnit: "piece" });
    const b = purchaseRecordId("onion", "sm-fairview", { packageAmount: 1, packageUnit: "piece" });
    expect(a).toBe(b);
  });

  it("differs across stores so records never collide across branches", () => {
    const a = purchaseRecordId("onion", "sm-fairview", {});
    const b = purchaseRecordId("onion", "sm-north-edsa", {});
    expect(a).not.toBe(b);
  });
});
