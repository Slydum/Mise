import { getCatalogEntry } from "@/lib/grocery/ingredient-catalog";
import { resolvePrice, type PriceOverride, type SeededPrice } from "@/lib/grocery/price-overrides";
import type { PackageForm, RetailPackage } from "@/lib/grocery/sm-packages";
import { toBaseAmount, unitKindOf } from "@/lib/grocery/units";
import type { UsageLine } from "@/lib/grocery/aggregate";
import type { GroceryItem, PriceSource } from "@/lib/types";

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
  pricePhp?: number;
  priceSource?: PriceSource;
  branch?: string;
  lastUpdatedAt?: string;
}

/**
 * A package can only price/size an ingredient's usage when their units are
 * compatible: same metric family (mass-mass, volume-volume — converted via
 * toBaseAmount before comparing) or an exact discrete-unit match ("piece" to
 * "piece", "clove" to "clove"). Pieces never compare against grams. When no
 * curated package is unit-compatible, the ingredient falls back to loose
 * practical rounding with no price attached — a price "needing confirmation."
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
 * whole retail packages (ceiling division) and carry the package's seeded
 * price; everything else falls back to a practical loose-amount rounding
 * with no price.
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
    pricePhp: pkg.pricePhp,
    priceSource: pkg.priceSource,
    branch: pkg.branch,
    lastUpdatedAt: pkg.lastUpdatedAt,
  };
}

/** Promotes large loose amounts to a friendlier unit (grams->kg, ml->L) for display. */
function toDisplayUnit(amount: number, baseUnit: string): { amount: number; unit: string } {
  if (baseUnit === "g" && amount >= 1000) return { amount: amount / 1000, unit: "kg" };
  if (baseUnit === "ml" && amount >= 1000) return { amount: amount / 1000, unit: "L" };
  return { amount, unit: baseUnit };
}

/**
 * Turns aggregated usage lines into final purchasable grocery items — ids
 * stay deterministic across regenerations so check-off state persists.
 * `overrides` (optional — pure/testable, no localStorage access here) layers
 * user price corrections over the seeded SM catalog per the fallback
 * priority in lib/grocery/price-overrides.ts.
 */
export function buildGroceryItems(usageLines: UsageLine[], overrides: PriceOverride[] = []): GroceryItem[] {
  return usageLines.map((line) => {
    const purchase = selectPurchase(line.canonicalKey, line.amount, line.baseUnit);
    const id = `gen-${line.canonicalKey}-${line.baseUnit}`.replace(/\s+/g, "-");

    const seeded: SeededPrice | undefined =
      purchase.pricePhp !== undefined
        ? {
            pricePhp: purchase.pricePhp,
            priceSource: purchase.priceSource!,
            branch: purchase.branch,
            lastUpdatedAt: purchase.lastUpdatedAt!,
          }
        : undefined;

    const resolved = resolvePrice(
      line.canonicalKey,
      { packageAmount: purchase.packageAmount, packageUnit: purchase.packageUnit, branch: purchase.branch },
      overrides,
      seeded,
    );

    const priceFields = resolved
      ? {
          estimatedPackagePricePhp: resolved.pricePhp,
          // The checkout cost is the whole package(s) bought, not the proportional value of what's used.
          estimatedTotalPricePhp: resolved.pricePhp * (purchase.packageCount ?? 1),
          priceSource: resolved.priceSource,
          priceUpdatedAt: resolved.priceUpdatedAt,
          ...(resolved.branch ? { branch: resolved.branch } : {}),
        }
      : {};

    const shared = {
      id,
      name: line.displayName,
      category: line.category,
      canonicalKey: line.canonicalKey,
      usageAmount: line.amount,
      usageUnit: line.baseUnit,
      ...priceFields,
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
