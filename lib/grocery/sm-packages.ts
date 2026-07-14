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

/**
 * How an ingredient is typically sold at a Philippine supermarket — package
 * *shape* only (size, unit, form). This is reference data about retail
 * packaging conventions, not a price: it exists so package-count math
 * ("you need 400g, that's sold in 1kg bags, so buy 1") works before any
 * price is known. See lib/sm/adapter.ts for why there's no price here —
 * Mise has no live SM Markets integration, so prices are never seeded.
 */
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
}

function shape(form: PackageForm, label: string, amount: number, unit: string): RetailPackage {
  return { form, label, amount, unit };
}

/**
 * Curated package shapes for ingredients used by the current recipe
 * collection, modeled on common Philippine retail package sizes. No prices
 * — see the module doc comment above.
 */
export const SM_PACKAGES: Record<string, RetailPackage[]> = {
  rice: [shape("kilogram", "1 kg bag", 1000, "g")],
  onion: [shape("piece", "piece", 1, "piece")],
  garlic: [shape("piece", "1 bulb (~12 cloves)", 12, "clove")],
  "cooking oil": [shape("bottle", "1 L bottle", 1000, "ml")],
  "soy sauce": [shape("bottle", "200 ml bottle (~13 tbsp)", 13, "tbsp")],
  "canned tuna": [shape("can", "can (155 g)", 1, "can")],
  egg: [shape("tray", "tray of 30", 30, "piece")],
  banana: [shape("bunch", "bunch of 6", 6, "piece")],
  "powdered milk": [shape("sachet", "sachet (33 g)", 33, "g")],
  pasta: [shape("pack", "500 g pack", 500, "g")],
  bread: [shape("pack", "loaf (20 slices)", 20, "slice")],
  chicken: [shape("kilogram", "1 kg", 1000, "g")],
  "bell pepper": [shape("piece", "piece", 1, "piece")],
  "spring onion": [shape("bunch", "bunch (100 g)", 100, "g")],

  cucumber: [shape("piece", "piece", 1, "piece")],
  lemon: [shape("piece", "piece", 1, "piece")],
  lime: [shape("piece", "piece", 1, "piece")],
  carrot: [shape("piece", "piece", 1, "piece")],
  "red onion": [shape("piece", "piece", 1, "piece")],
  apple: [shape("piece", "piece", 1, "piece")],
  avocado: [shape("piece", "piece", 1, "piece")],
  "salmon fillet": [shape("piece", "fillet", 1, "piece")],
  "fresh ginger": [shape("piece", "knob", 1, "thumb")],
  broccoli: [shape("piece", "1 head", 1, "head")],
  "red cabbage": [shape("piece", "1 head", 1, "head")],
  "fresh dill": [shape("bunch", "small bunch", 1, "small bunch")],

  "chicken thigh": [shape("kilogram", "1 kg pack", 1000, "g")],
  quinoa: [shape("pack", "250 g pack", 250, "g")],
  feta: [shape("pack", "200 g block", 200, "g")],
  "greek yogurt": [shape("pack", "170 g cup", 170, "g")],
  "smoked salmon": [shape("pack", "100 g pack", 100, "g")],
  "mixed salad green": [shape("pack", "100 g bag", 100, "g")],
  "red lentil": [shape("pack", "250 g pack", 250, "g")],
  "firm tofu": [shape("pack", "300 g pack", 300, "g")],
  "snap pea": [shape("pack", "150 g pack", 150, "g")],
  "cherry tomato": [shape("pack", "200 g pack", 200, "g")],
  "kalamata olive": [shape("pack", "200 g jar", 200, "g")],
  hummus: [shape("pack", "200 g tub", 200, "g")],
  "rolled oat": [shape("pack", "500 g pack", 500, "g")],
  "mixed berry": [shape("pack", "250 g pack (frozen)", 250, "g")],
  granola: [shape("pack", "300 g pack", 300, "g")],
  "sushi rice": [shape("pack", "1 kg pack", 1000, "g")],
  chickpea: [shape("can", "can (400 g)", 1, "can")],
  tomato: [shape("can", "can (400 g)", 1, "can")],

  "coconut milk": [shape("can", "400 ml can", 400, "ml")],
  "vegetable stock": [shape("liter", "1 L tetra pack", 1000, "ml")],
  "almond milk": [shape("bottle", "1 L bottle", 1000, "ml")],

  "olive oil": [shape("bottle", "500 ml bottle (~34 tbsp)", 34, "tbsp")],
  "sesame oil": [shape("bottle", "150 ml bottle (~10 tbsp)", 10, "tbsp")],
  "curry powder": [shape("pack", "small jar (~12 tbsp)", 12, "tbsp")],
  tahini: [shape("pack", "300 g jar (~20 tbsp)", 20, "tbsp")],
  "almond butter": [shape("pack", "250 g jar (~17 tbsp)", 17, "tbsp")],
  honey: [shape("pack", "250 g jar (~12 tbsp)", 12, "tbsp")],

  "pita bread": [shape("pack", "pack of 6", 6, "piece")],
  "sourdough bread": [shape("pack", "pack of 10 slices", 10, "slice")],
  "egg noodle": [shape("pack", "single nest", 1, "nest")],
};
