import { describe, expect, it } from "vitest";
import { purchaseRecordId } from "@/lib/grocery/purchase-history";

const pkg = (packageAmount: number, packageUnit: string) => ({ pricingKind: "package" as const, packageAmount, packageUnit });

describe("purchaseRecordId", () => {
  it("is deterministic for the same ingredient/store/source/package context", () => {
    const a = purchaseRecordId("onion", "sm-fairview", "receipt", pkg(1, "piece"));
    const b = purchaseRecordId("onion", "sm-fairview", "receipt", pkg(1, "piece"));
    expect(a).toBe(b);
  });

  it("differs across canonical keys, stores, package sizes, or the record kind", () => {
    const base = purchaseRecordId("onion", "sm-fairview", "receipt", pkg(1, "piece"));
    expect(purchaseRecordId("garlic", "sm-fairview", "receipt", pkg(1, "piece"))).not.toBe(base);
    expect(purchaseRecordId("onion", "sm-north-edsa", "receipt", pkg(1, "piece"))).not.toBe(base);
    expect(purchaseRecordId("onion", "sm-fairview", "user-verified", pkg(1, "piece"))).not.toBe(base);
    expect(purchaseRecordId("onion", "sm-fairview", "receipt", pkg(2, "piece"))).not.toBe(base);
  });

  it("is deterministic and store-scoped for a per-kg rate, ignoring package size", () => {
    const a = purchaseRecordId("avocado", "puregold-imus", "receipt", { pricingKind: "per-kg" });
    const b = purchaseRecordId("avocado", "puregold-imus", "receipt", { pricingKind: "per-kg", packageAmount: 5 });
    expect(a).toBe(b);
    expect(purchaseRecordId("avocado", "sm-imus", "receipt", { pricingKind: "per-kg" })).not.toBe(a);
  });

  it("keeps a per-kg rate and a package price for the same ingredient/store as distinct records", () => {
    const perKg = purchaseRecordId("avocado", "puregold-imus", "receipt", { pricingKind: "per-kg" });
    const asPackage = purchaseRecordId("avocado", "puregold-imus", "receipt", pkg(1, "piece"));
    expect(perKg).not.toBe(asPackage);
  });
});
