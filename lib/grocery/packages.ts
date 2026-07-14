import { getCatalogEntry } from "@/lib/grocery/ingredient-catalog";
import type { PackageForm } from "@/lib/grocery/sm-packages";
import type { UsageLine } from "@/lib/grocery/aggregate";
import type { GroceryItem } from "@/lib/types";

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
}

/**
 * The usage-vs-purchase split: how much a recipe needs vs. what you'd
 * actually have to buy. Curated ingredients round up to whole retail
 * packages (ceiling division); everything else falls back to a practical
 * loose-amount rounding.
 */
export function selectPurchase(canonicalKey: string, neededAmount: number, baseUnit: string): PurchaseSelection {
  const entry = getCatalogEntry(canonicalKey);
  const pkg = entry.packages[0];
  if (!pkg) {
    return { purchaseAmount: roundToPracticalAmount(neededAmount, baseUnit) };
  }
  const packageCount = Math.max(1, Math.ceil(neededAmount / pkg.amount));
  return {
    purchaseAmount: packageCount * pkg.amount,
    packageForm: pkg.form,
    packageCount,
    packageLabel: pkg.label,
  };
}

/** Promotes large loose amounts to a friendlier unit (grams->kg, ml->L) for display. */
function toDisplayUnit(amount: number, baseUnit: string): { amount: number; unit: string } {
  if (baseUnit === "g" && amount >= 1000) return { amount: amount / 1000, unit: "kg" };
  if (baseUnit === "ml" && amount >= 1000) return { amount: amount / 1000, unit: "L" };
  return { amount, unit: baseUnit };
}

/** Turns aggregated usage lines into final purchasable grocery items — ids stay deterministic across regenerations so check-off state persists. */
export function buildGroceryItems(usageLines: UsageLine[]): GroceryItem[] {
  return usageLines.map((line) => {
    const purchase = selectPurchase(line.canonicalKey, line.amount, line.baseUnit);
    const id = `gen-${line.canonicalKey}-${line.baseUnit}`.replace(/\s+/g, "-");

    if (purchase.packageForm && purchase.packageCount) {
      return {
        id,
        name: line.displayName,
        amount: purchase.packageCount,
        unit: purchase.packageForm,
        category: line.category,
        canonicalKey: line.canonicalKey,
      };
    }

    const { amount, unit } = toDisplayUnit(purchase.purchaseAmount, line.baseUnit);
    return {
      id,
      name: line.displayName,
      amount,
      unit,
      category: line.category,
      canonicalKey: line.canonicalKey,
    };
  });
}
