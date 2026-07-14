import type { PriceSource } from "@/lib/types";

export type PackageForm =
  | "piece"
  | "bunch"
  | "can"
  | "sachet"
  | "pack"
  | "bottle"
  | "tray"
  | "kilogram"
  | "gram"
  | "milliliter"
  | "liter"
  | "pouch"
  | "dozen";

export interface RetailPackage {
  form: PackageForm;
  label: string;
  /**
   * Quantity contained in one package, expressed in `unit`. `unit` must be
   * either a metric base unit ("g" or "ml", so it's convertible against any
   * g/kg or ml/L ingredient usage) or the exact discrete unit token a recipe
   * would use (e.g. "piece", "clove", "can", "tbsp", "head") — packages are
   * only matched to an ingredient's usage when the units are compatible.
   */
  amount: number;
  unit: string;
  /** Estimated shelf/checkout price for one package, in PHP. Always approximate — see priceSource. */
  pricePhp: number;
  priceSource: PriceSource;
  /** Preferred SM branch this estimate reflects, when known. Absent means a general/typical SM price. */
  branch?: string;
  /** ISO date this price was last confirmed. */
  lastUpdatedAt: string;
}

const SEEDED_AT = "2026-06-20";

function seed(form: PackageForm, label: string, amount: number, unit: string, pricePhp: number): RetailPackage {
  return { form, label, amount, unit, pricePhp, priceSource: "manual-sm", lastUpdatedAt: SEEDED_AT };
}

/**
 * Small curated SM Markets mock price catalog — not scraped, not live.
 * Covers common Philippine grocery staples plus every ingredient used by the
 * current recipe collection that has a sensible fixed retail package. Items
 * typically called for in tiny pantry measures (a pinch, a tsp of spice) are
 * deliberately left unpriced — see lib/grocery/packages.ts's graceful
 * "price unavailable" handling.
 */
export const SM_PACKAGES: Record<string, RetailPackage[]> = {
  // Pre-existing generic staples ------------------------------------------------
  rice: [seed("kilogram", "1 kg bag", 1000, "g", 65)],
  onion: [seed("piece", "piece", 1, "piece", 12)],
  garlic: [seed("piece", "1 bulb (~12 cloves)", 12, "clove", 38)],
  "cooking oil": [seed("bottle", "1 L bottle", 1000, "ml", 95)],
  "soy sauce": [seed("bottle", "200 ml bottle (~13 tbsp)", 13, "tbsp", 18)],
  "canned tuna": [seed("can", "can (155 g)", 1, "can", 35)],
  egg: [seed("tray", "tray of 30", 30, "piece", 210)],
  banana: [seed("bunch", "bunch of 6", 6, "piece", 60)],
  "powdered milk": [seed("sachet", "sachet (33 g)", 33, "g", 14)],
  pasta: [seed("pack", "500 g pack", 500, "g", 65)],
  bread: [seed("pack", "loaf (20 slices)", 20, "slice", 75)],
  chicken: [seed("kilogram", "1 kg", 1000, "g", 190)],
  "bell pepper": [seed("piece", "piece", 1, "piece", 35)],
  "spring onion": [seed("bunch", "bunch (100 g)", 100, "g", 15)],

  // Produce, priced per piece to match how recipes actually call for them ------
  cucumber: [seed("piece", "piece", 1, "piece", 18)],
  lemon: [seed("piece", "piece", 1, "piece", 15)],
  lime: [seed("piece", "piece", 1, "piece", 8)],
  carrot: [seed("piece", "piece", 1, "piece", 8)],
  "red onion": [seed("piece", "piece", 1, "piece", 15)],
  apple: [seed("piece", "piece", 1, "piece", 20)],
  avocado: [seed("piece", "piece", 1, "piece", 45)],
  "salmon fillet": [seed("piece", "fillet", 1, "piece", 180)],
  "fresh ginger": [seed("piece", "knob", 1, "thumb", 10)],
  broccoli: [seed("piece", "1 head", 1, "head", 75)],
  "red cabbage": [seed("piece", "1 head", 1, "head", 60)],
  "fresh dill": [seed("bunch", "small bunch", 1, "small bunch", 25)],

  // Weighed produce/protein/dairy, priced by the pack closest to real shelf sizes
  "chicken thigh": [seed("kilogram", "1 kg pack", 1000, "g", 210)],
  quinoa: [seed("pack", "250 g pack", 250, "g", 280)],
  feta: [seed("pack", "200 g block", 200, "g", 320)],
  "greek yogurt": [seed("pack", "170 g cup", 170, "g", 145)],
  "smoked salmon": [seed("pack", "100 g pack", 100, "g", 280)],
  "mixed salad green": [seed("pack", "100 g bag", 100, "g", 85)],
  "red lentil": [seed("pack", "250 g pack", 250, "g", 120)],
  "firm tofu": [seed("pack", "300 g pack", 300, "g", 65)],
  "snap pea": [seed("pack", "150 g pack", 150, "g", 65)],
  "cherry tomato": [seed("pack", "200 g pack", 200, "g", 55)],
  "kalamata olive": [seed("pack", "200 g jar", 200, "g", 180)],
  hummus: [seed("pack", "200 g tub", 200, "g", 135)],
  "rolled oat": [seed("pack", "500 g pack", 500, "g", 140)],
  "mixed berry": [seed("pack", "250 g pack (frozen)", 250, "g", 180)],
  granola: [seed("pack", "300 g pack", 300, "g", 195)],
  "sushi rice": [seed("pack", "1 kg pack", 1000, "g", 130)],
  chickpea: [seed("can", "can (400 g)", 1, "can", 35)],
  tomato: [seed("can", "can (400 g)", 1, "can", 30)],

  // Liquids sold by the bottle but used in ml or L — direct metric match -------
  "coconut milk": [seed("can", "400 ml can", 400, "ml", 55)],
  "vegetable stock": [seed("liter", "1 L tetra pack", 1000, "ml", 85)],
  "almond milk": [seed("bottle", "1 L bottle", 1000, "ml", 150)],

  // Condiments/oils used by the tbsp/tsp — package amount pre-converted to the
  // ingredient's actual usage unit so a practical package count can be found.
  "olive oil": [seed("bottle", "500 ml bottle (~34 tbsp)", 34, "tbsp", 220)],
  "sesame oil": [seed("bottle", "150 ml bottle (~10 tbsp)", 10, "tbsp", 95)],
  "curry powder": [seed("pack", "small jar (~12 tbsp)", 12, "tbsp", 75)],
  tahini: [seed("pack", "300 g jar (~20 tbsp)", 20, "tbsp", 220)],
  "almond butter": [seed("pack", "250 g jar (~17 tbsp)", 17, "tbsp", 320)],
  honey: [seed("pack", "250 g jar (~12 tbsp)", 12, "tbsp", 160)],

  // Bread/grain items sold in fixed packs -----------------------------------
  "pita bread": [seed("pack", "pack of 6", 6, "piece", 90)],
  "sourdough bread": [seed("pack", "pack of 10 slices", 10, "slice", 140)],
  "egg noodle": [seed("pack", "single nest", 1, "nest", 20)],
};
