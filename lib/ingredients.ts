import type { Ingredient } from "@/lib/types";

/** Units that don't take a plural "s" — measurement abbreviations and collective counts. */
const INVARIANT_UNITS = new Set(["g", "kg", "ml", "l", "tbsp", "tsp", "cup", "oz", "lb", "dozen", ""]);

const FRACTION_GLYPHS: [number, string][] = [
  [0.25, "¼"],
  [0.3333, "⅓"],
  [0.5, "½"],
  [0.6667, "⅔"],
  [0.75, "¾"],
];

/** Formats a scaled amount, using fraction glyphs for common fractional remainders. */
export function formatAmount(amount: number): string {
  const whole = Math.floor(amount);
  const frac = amount - whole;
  if (frac < 0.02) return String(whole);
  const match = FRACTION_GLYPHS.find(([value]) => Math.abs(frac - value) < 0.02);
  const fracStr = match ? match[1] : frac.toFixed(2).replace(/^0/, "");
  return whole > 0 ? `${whole}${fracStr}` : fracStr;
}

/** Pluralizes a unit for display when the (unrounded) amount isn't 1. */
export function formatUnit(unit: string, amount: number): string {
  if (!unit || INVARIANT_UNITS.has(unit.toLowerCase()) || amount === 1) return unit;
  if (/[chsx]$/.test(unit)) return `${unit}es`;
  return `${unit}s`;
}

/** Combines amount + unit into a display string, e.g. "1½ cups" or "3 cloves". */
export function formatQuantity(amount: number, unit: string): string {
  const amountStr = formatAmount(amount);
  const unitStr = formatUnit(unit, amount);
  return unitStr ? `${amountStr} ${unitStr}` : amountStr;
}

/** Scales an ingredient's amount by a servings ratio (e.g. 6 servings / 4 base = 1.5). */
export function scaleIngredient(ingredient: Ingredient, ratio: number): Ingredient {
  return { ...ingredient, amount: ingredient.amount * ratio };
}
