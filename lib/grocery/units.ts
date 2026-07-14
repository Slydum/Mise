/**
 * Metric unit conversion for ingredient aggregation. Scope is deliberately
 * narrow — only g/kg (mass) and ml/L (volume) convert, matching the actual
 * units used across the recipe catalog (verified: everything else — tbsp,
 * tsp, clove, can, head, pinch, bunch, etc. — is a discrete/count unit with
 * no general conversion rule). Discrete units pass through unchanged and are
 * only combined when they match exactly.
 */

export type UnitKind = "mass" | "volume" | "discrete";

const MASS_TO_GRAMS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
};

export function unitKindOf(unit: string): UnitKind {
  const key = unit.trim().toLowerCase();
  if (key in MASS_TO_GRAMS) return "mass";
  if (key in VOLUME_TO_ML) return "volume";
  return "discrete";
}

/** Converts to the base unit for its kind (grams for mass, milliliters for volume); discrete units pass through as-is. */
export function toBaseAmount(amount: number, unit: string): { amount: number; baseUnit: string } {
  const key = unit.trim().toLowerCase();
  if (key in MASS_TO_GRAMS) return { amount: amount * MASS_TO_GRAMS[key], baseUnit: "g" };
  if (key in VOLUME_TO_ML) return { amount: amount * VOLUME_TO_ML[key], baseUnit: "ml" };
  return { amount, baseUnit: key || "piece" };
}
