/**
 * What the user says they actually paid for an ingredient at a specific SM
 * store — a purchase record, not a price estimate. This is the only price
 * data Mise has today (there is no live SM Markets integration — see
 * lib/sm/adapter.ts), and it is always presented as history, never as a
 * current live price (see GroceryItem.lastPaidPricePhp in lib/types.ts).
 *
 * Scoped to a store: a price paid at one branch has no bearing on another,
 * so records never leak across storeId. Changing the selected store doesn't
 * delete anything — old records stay for history, they just stop
 * contributing to what's shown as "last paid" for the newly selected store.
 */
export interface PurchaseRecord {
  /** Deterministic — derived from the match context, so re-logging a purchase for the same item/package/store replaces rather than appends. */
  id: string;
  canonicalKey: string;
  storeId: string;
  pricePhp: number;
  packageAmount?: number;
  packageUnit?: string;
  /** What the user says they actually bought — free text, since there's no product catalog to pick from. */
  productLabel?: string;
  purchasedAt: string;
  receiptReference?: string;
}

export interface PurchaseMatchContext {
  packageAmount?: number;
  packageUnit?: string;
}

/** Deterministic id for a match context, so logging a purchase for the same item/package/store replaces the prior record. */
export function purchaseRecordId(canonicalKey: string, storeId: string, context: PurchaseMatchContext): string {
  return `${canonicalKey}::${storeId}::${context.packageAmount ?? "any"}::${context.packageUnit ?? "any"}`;
}

function specificity(record: PurchaseRecord): number {
  return record.packageAmount !== undefined ? 1 : 0;
}

function isApplicable(record: PurchaseRecord, canonicalKey: string, storeId: string, context: PurchaseMatchContext): boolean {
  if (record.canonicalKey !== canonicalKey) return false;
  if (record.storeId !== storeId) return false;
  if (
    record.packageAmount !== undefined &&
    (record.packageAmount !== context.packageAmount || record.packageUnit !== context.packageUnit)
  ) {
    return false;
  }
  return true;
}

/**
 * The most recent matching purchase record for this ingredient at this
 * store — package-size-specific records outrank package-agnostic ones,
 * ties go to the most recently purchased. Never falls back across stores
 * and never invents a price when nothing matches.
 */
export function resolveLastPaid(
  canonicalKey: string,
  storeId: string,
  context: PurchaseMatchContext,
  records: PurchaseRecord[],
): PurchaseRecord | undefined {
  const applicable = records.filter((r) => isApplicable(r, canonicalKey, storeId, context));
  if (applicable.length === 0) return undefined;

  return applicable.slice().sort((a, b) => {
    const specDiff = specificity(b) - specificity(a);
    if (specDiff !== 0) return specDiff;
    return b.purchasedAt.localeCompare(a.purchasedAt);
  })[0];
}
