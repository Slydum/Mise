import type { PurchaseRecord } from "@/lib/grocery/purchase-history";
import { PRICE_SOURCE_LABELS, type CommodityPrice, type CommodityUnit } from "@/lib/pricing/types";

/**
 * The one pricing source that's actually real today: the user's own
 * receipts and manual verifications at whatever store they actually shop
 * at, stored locally (see lib/grocery/purchase-history.ts). No network
 * access needed, so unlike the PSA/DTI adapters this one has genuine data
 * to convert — but it's still always an exact-product record
 * (isExactStorePrice: true), never a commodity-level reference.
 */
export function purchaseRecordToCommodityPrice(
  record: PurchaseRecord,
  displayName: string,
  storeName?: string,
): CommodityPrice {
  const sourceLabel = storeName
    ? record.source === "receipt"
      ? `Last paid at ${storeName}`
      : `Verified at ${storeName}`
    : PRICE_SOURCE_LABELS[record.source];

  return {
    id: record.id,
    canonicalIngredientKey: record.canonicalKey,
    displayName,
    commodityName: record.productLabel ?? displayName,
    amount: record.packageAmount ?? 1,
    unit: (record.packageUnit as CommodityUnit) ?? "piece",
    pricePhp: record.pricePhp,
    source: record.source,
    sourceLabel,
    storeId: record.storeId,
    storeName,
    referencePeriod: record.purchasedAt.slice(0, 7),
    fetchedAt: record.purchasedAt,
    verifiedAt: record.source === "user-verified" ? record.purchasedAt : undefined,
    isExactStorePrice: true,
    isWeighted: false,
  };
}

export function purchaseRecordsToCommodityPrices(
  records: PurchaseRecord[],
  nameFor: (canonicalKey: string) => string,
  storeNameFor: (storeId: string) => string | undefined,
): CommodityPrice[] {
  return records.map((r) => purchaseRecordToCommodityPrice(r, nameFor(r.canonicalKey), storeNameFor(r.storeId)));
}
