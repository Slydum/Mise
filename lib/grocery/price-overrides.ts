import type { PriceSource } from "@/lib/types";

/**
 * A user-entered price correction, matched against generated grocery items
 * by canonical ingredient key and — where the caller has it — package size,
 * package unit, and branch, so a correction for one package size/branch
 * doesn't bleed into an unrelated one. Persisted separately from generated
 * GroceryItems (see lib/data/local-store.ts) so it survives every
 * regeneration of the plan-derived list, not just a single item's lifetime.
 */
export interface PriceOverride {
  /** Deterministic — derived from the match context, so re-saving the same context replaces rather than appends. */
  id: string;
  canonicalKey: string;
  pricePhp: number;
  /** Overrides are always user-driven: an actual price the shopper typed in, or one read off a saved receipt. */
  priceSource: Extract<PriceSource, "manual-sm" | "receipt">;
  packageAmount?: number;
  packageUnit?: string;
  productName?: string;
  branch?: string;
  updatedAt: string;
}

export interface SeededPrice {
  pricePhp: number;
  priceSource: PriceSource;
  branch?: string;
  lastUpdatedAt: string;
}

export interface ResolvedPrice {
  pricePhp: number;
  priceSource: PriceSource;
  branch?: string;
  priceUpdatedAt: string;
}

export interface PriceMatchContext {
  packageAmount?: number;
  packageUnit?: string;
  branch?: string;
}

/** A user-entered actual price outranks a receipt price outranks the seeded catalog. */
const OVERRIDE_SOURCE_RANK: Record<PriceOverride["priceSource"], number> = {
  "manual-sm": 0,
  receipt: 1,
};

/** More specific overrides (tied to a branch and/or a package size) outrank general ones. */
function specificity(override: PriceOverride): number {
  return (override.branch !== undefined ? 2 : 0) + (override.packageAmount !== undefined ? 1 : 0);
}

function isApplicable(override: PriceOverride, canonicalKey: string, context: PriceMatchContext): boolean {
  if (override.canonicalKey !== canonicalKey) return false;
  if (
    override.packageAmount !== undefined &&
    (override.packageAmount !== context.packageAmount || override.packageUnit !== context.packageUnit)
  ) {
    return false;
  }
  if (override.branch !== undefined && override.branch !== context.branch) return false;
  return true;
}

/**
 * Resolves the price to show for a grocery item, per the fallback priority:
 * latest user-entered actual price > latest saved receipt price > seeded SM
 * package price > unavailable. Ties within a tier go to the more specific
 * (branch/package-matched) override, then the most recently updated one.
 */
export function resolvePrice(
  canonicalKey: string,
  context: PriceMatchContext,
  overrides: PriceOverride[],
  seeded?: SeededPrice,
): ResolvedPrice | undefined {
  const applicable = overrides.filter((o) => isApplicable(o, canonicalKey, context));

  if (applicable.length > 0) {
    const best = applicable.slice().sort((a, b) => {
      const sourceDiff = OVERRIDE_SOURCE_RANK[a.priceSource] - OVERRIDE_SOURCE_RANK[b.priceSource];
      if (sourceDiff !== 0) return sourceDiff;
      const specDiff = specificity(b) - specificity(a);
      if (specDiff !== 0) return specDiff;
      return b.updatedAt.localeCompare(a.updatedAt);
    })[0];
    return { pricePhp: best.pricePhp, priceSource: best.priceSource, branch: best.branch, priceUpdatedAt: best.updatedAt };
  }

  if (seeded) {
    return {
      pricePhp: seeded.pricePhp,
      priceSource: seeded.priceSource,
      branch: seeded.branch,
      priceUpdatedAt: seeded.lastUpdatedAt,
    };
  }

  return undefined;
}

/** Deterministic id for a match context, so saving a correction for the same item/package/branch replaces the prior one. */
export function overrideId(canonicalKey: string, context: PriceMatchContext): string {
  return `${canonicalKey}::${context.packageAmount ?? "any"}::${context.packageUnit ?? "any"}::${context.branch ?? "any"}`;
}
