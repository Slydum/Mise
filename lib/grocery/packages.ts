import { getCatalogEntry } from "@/lib/grocery/ingredient-catalog";
import type { PackageForm, RetailPackage } from "@/lib/grocery/sm-packages";
import { toBaseAmount, unitKindOf } from "@/lib/grocery/units";
import type { UsageLine } from "@/lib/grocery/aggregate";
import { resolvePrice, type PriceMatchContext } from "@/lib/pricing/priority";
import type { CommodityPrice } from "@/lib/pricing/types";
import type { GroceryItem, GroceryItemPriceInfo } from "@/lib/types";

/** Rounds a usage amount up to a practical shopping increment — fine-grained for small amounts, coarser for large ones. */
export function roundToPracticalAmount(amount: number, baseUnit: string): number {
  if (amount <= 0) return 0;
  if (baseUnit === "g" || baseUnit === "ml") {
    const increment = amount < 50 ? 5 : 50;
    return Math.ceil(amount / increment) * increment;
  }
  return Math.ceil(amount);
}

export interface PurchaseSelection {
  purchaseAmount: number;
  packageForm?: PackageForm;
  packageCount?: number;
  packageLabel?: string;
  packageAmount?: number;
  packageUnit?: string;
}

/**
 * A package can only size an ingredient's usage when their units are
 * compatible: same metric family (mass-mass, volume-volume — converted via
 * toBaseAmount before comparing) or an exact discrete-unit match ("piece" to
 * "piece", "clove" to "clove"). Pieces never compare against grams. When no
 * curated package is unit-compatible, the ingredient falls back to loose
 * practical rounding.
 */
function isUnitCompatible(baseUnit: string, packageUnit: string): boolean {
  const baseKind = unitKindOf(baseUnit);
  const packageKind = unitKindOf(packageUnit);
  if (baseKind === "discrete" || packageKind === "discrete") {
    return baseUnit.trim().toLowerCase() === packageUnit.trim().toLowerCase();
  }
  return baseKind === packageKind;
}

function findCompatiblePackage(packages: RetailPackage[], baseUnit: string): RetailPackage | undefined {
  return packages.find((pkg) => isUnitCompatible(baseUnit, pkg.unit));
}

/**
 * The usage-vs-purchase split: how much a recipe needs vs. what you'd
 * actually have to buy. Curated, unit-compatible ingredients round up to
 * whole retail packages (ceiling division); everything else falls back to a
 * practical loose-amount rounding. Package *shapes* only — no pricing lives
 * here (see lib/grocery/sm-packages.ts).
 */
export function selectPurchase(canonicalKey: string, neededAmount: number, baseUnit: string): PurchaseSelection {
  const entry = getCatalogEntry(canonicalKey);
  const pkg = findCompatiblePackage(entry.packages, baseUnit);
  if (!pkg) {
    return { purchaseAmount: roundToPracticalAmount(neededAmount, baseUnit) };
  }

  const neededBase = toBaseAmount(neededAmount, baseUnit);
  const packageBase = toBaseAmount(pkg.amount, pkg.unit);
  const packageCount = Math.max(1, Math.ceil(neededBase.amount / packageBase.amount));

  return {
    purchaseAmount: packageCount * packageBase.amount,
    packageForm: pkg.form,
    packageCount,
    packageLabel: pkg.label,
    packageAmount: pkg.amount,
    packageUnit: pkg.unit,
  };
}

/** Promotes large loose amounts to a friendlier unit (grams->kg, ml->L) for display. */
function toDisplayUnit(amount: number, baseUnit: string): { amount: number; unit: string } {
  if (baseUnit === "g" && amount >= 1000) return { amount: amount / 1000, unit: "kg" };
  if (baseUnit === "ml" && amount >= 1000) return { amount: amount / 1000, unit: "L" };
  return { amount, unit: baseUnit };
}

/** Converts a usage amount into kg (mass) or L (volume) for PSA per-unit pricing. Discrete units (piece, bunch, clove, ...) have no per-kg meaning and return undefined. */
function toKgOrLiter(amount: number, baseUnit: string): { amount: number; kind: "kg" | "L" } | undefined {
  if (baseUnit === "g") return { amount: amount / 1000, kind: "kg" };
  if (baseUnit === "kg") return { amount, kind: "kg" };
  if (baseUnit === "ml") return { amount: amount / 1000, kind: "L" };
  if (baseUnit === "L") return { amount, kind: "L" };
  return undefined;
}

/**
 * Turns a resolved CommodityPrice into the cost figure for this grocery
 * line, per GROCERY CALCULATIONS:
 *   - Weighted prices (PSA references, or a receipt/verified per-kg rate
 *     for produce sold by weight — see CommodityPrice.isWeighted):
 *     usageCost = requiredWeightInKg * pricePerKg (or per liter) — an
 *     expected cost that scales with however much is actually bought, not
 *     a guaranteed checkout total. Unavailable if the usage unit has no
 *     per-kg/per-liter meaning (e.g. "piece", "bunch") or the resolved
 *     price lacks that rate.
 *   - Package-priced sources (receipt, user-verified, dti-epresyo):
 *     checkout cost = packageCount * packagePricePhp — an exact, real
 *     cost for the specific package bought.
 */
function computePriceInfo(
  line: UsageLine,
  purchase: PurchaseSelection,
  storeId: string | null,
  candidates: CommodityPrice[],
): GroceryItemPriceInfo | undefined {
  const context: PriceMatchContext = {
    canonicalIngredientKey: line.canonicalKey,
    packageAmount: purchase.packageAmount,
    packageUnit: purchase.packageUnit,
    storeId: storeId ?? undefined,
  };
  const resolved = resolvePrice(context, candidates);
  if (!resolved) return undefined;

  if (resolved.isWeighted) {
    const converted = toKgOrLiter(line.amount, line.baseUnit);
    if (!converted) return undefined;
    const perUnitPrice = converted.kind === "kg" ? resolved.pricePerKgPhp : resolved.pricePerLiterPhp;
    if (perUnitPrice === undefined) return undefined;
    return { price: resolved, lineTotalPhp: converted.amount * perUnitPrice, isUsageReference: true };
  }

  const packageCount = purchase.packageCount ?? 1;
  return { price: resolved, packageCount, lineTotalPhp: packageCount * resolved.pricePhp, isUsageReference: false };
}

/**
 * Turns aggregated usage lines into final purchasable grocery items — ids
 * stay deterministic across regenerations so check-off state persists.
 *
 * `priceCandidates` is every CommodityPrice available from every source
 * (PSA OpenSTAT, PSA Price Situationer, DTI e-Presyo, the user's own SM
 * verifications/receipts — see lib/pricing/), already gathered by the
 * caller. This function never fetches and never fabricates: an item with
 * no matching candidate simply has no `priceInfo`, which the UI renders as
 * "Price unavailable."
 */
export function buildGroceryItems(
  usageLines: UsageLine[],
  storeId: string | null = null,
  priceCandidates: CommodityPrice[] = [],
): GroceryItem[] {
  return usageLines.map((line) => {
    const purchase = selectPurchase(line.canonicalKey, line.amount, line.baseUnit);
    const id = `gen-${line.canonicalKey}-${line.baseUnit}`.replace(/\s+/g, "-");
    const priceInfo = computePriceInfo(line, purchase, storeId, priceCandidates);

    const shared = {
      id,
      name: line.displayName,
      category: line.category,
      canonicalKey: line.canonicalKey,
      usageAmount: line.amount,
      usageUnit: line.baseUnit,
      ...(priceInfo ? { priceInfo } : {}),
    };

    if (purchase.packageForm && purchase.packageCount) {
      return {
        ...shared,
        amount: purchase.packageCount,
        unit: purchase.packageForm,
        packageCount: purchase.packageCount,
        packageLabel: purchase.packageLabel,
        packageAmount: purchase.packageAmount,
        packageUnit: purchase.packageUnit,
      };
    }

    const { amount, unit } = toDisplayUnit(purchase.purchaseAmount, line.baseUnit);
    return { ...shared, amount, unit };
  });
}
