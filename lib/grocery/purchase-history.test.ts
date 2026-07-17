import { describe, expect, it } from "vitest";
import { purchaseRecordId } from "@/lib/grocery/purchase-history";

describe("purchaseRecordId", () => {
  it("is deterministic for the same ingredient/store/source/package context", () => {
    const a = purchaseRecordId("onion", "sm-fairview", "receipt", { packageAmount: 1, packageUnit: "piece" });
    const b = purchaseRecordId("onion", "sm-fairview", "receipt", { packageAmount: 1, packageUnit: "piece" });
    expect(a).toBe(b);
  });

  it("differs across canonical keys, stores, package sizes, or the record kind", () => {
    const base = purchaseRecordId("onion", "sm-fairview", "receipt", { packageAmount: 1, packageUnit: "piece" });
    expect(purchaseRecordId("garlic", "sm-fairview", "receipt", { packageAmount: 1, packageUnit: "piece" })).not.toBe(base);
    expect(purchaseRecordId("onion", "sm-north-edsa", "receipt", { packageAmount: 1, packageUnit: "piece" })).not.toBe(base);
    expect(purchaseRecordId("onion", "sm-fairview", "user-verified-sm", { packageAmount: 1, packageUnit: "piece" })).not.toBe(
      base,
    );
    expect(purchaseRecordId("onion", "sm-fairview", "receipt", { packageAmount: 2, packageUnit: "piece" })).not.toBe(base);
  });
});
