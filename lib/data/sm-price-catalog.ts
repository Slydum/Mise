import type { GroceryCategory, Unit } from "@/lib/types";

/**
 * A small, curated sample of SM Markets pricing — not a live feed. Covers
 * exactly the ingredients used across the recipe catalog, keyed by the
 * ingredient's canonical name (see `canonicalKey` in lib/grocery.ts).
 *
 * Prices are indicative PHP estimates for a typical SM Supermarket/Hypermarket
 * shelf price as of the date below; real prices vary by branch and promo.
 */
export interface PriceCatalogEntry {
  /** Display name, matching Ingredient.name across recipes. */
  name: string;
  category: GroceryCategory;
  unit: Unit;
  /** How much one purchasable package contains, in `unit`. */
  packageAmount: number;
  /** Human-readable package description, e.g. "1 kg pack (~8 pcs)". */
  packageLabel: string;
  pricePhp: number;
  /**
   * Long shelf-life condiment/oil/spice a household typically already has
   * some of — assumed partially in-stock by default (see buildPantryDefaults
   * in lib/grocery.ts) so a single recipe's small usage doesn't force a
   * fresh purchase every week.
   */
  pantryStaple?: boolean;
}

export const PRICE_CATALOG_META = {
  source: "SM Markets (curated sample basket)",
  lastUpdated: "2026-06-01",
  note: "Indicative prices from a small sample basket, not a live feed — actual prices vary by branch and promotions.",
};

export const PRICE_CATALOG: Record<string, PriceCatalogEntry> = {
  // Produce ---------------------------------------------------------------
  "mixed berries": { name: "Mixed berries", category: "produce", unit: "g", packageAmount: 150, packageLabel: "150 g pack", pricePhp: 180 },
  "avocado": { name: "Avocado", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 35 },
  "lemon": { name: "Lemon", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 18 },
  "banana": { name: "Banana", category: "produce", unit: "pc", packageAmount: 6, packageLabel: "1 hand (~6 pcs)", pricePhp: 60 },
  "bell pepper": { name: "Bell pepper", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 25 },
  "onion": { name: "Onion", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 12 },
  "garlic": { name: "Garlic", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 bulb", pricePhp: 15 },
  "cucumber": { name: "Cucumber", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 15 },
  "red cabbage": { name: "Red cabbage", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 head", pricePhp: 90 },
  "carrots": { name: "Carrots", category: "produce", unit: "pc", packageAmount: 8, packageLabel: "1 kg pack (~8 pcs)", pricePhp: 70 },
  "limes": { name: "Limes", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 6 },
  "broccoli": { name: "Broccoli", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 head", pricePhp: 110 },
  "fresh ginger": { name: "Fresh ginger", category: "produce", unit: "g", packageAmount: 100, packageLabel: "100 g pack", pricePhp: 25 },
  "snap peas": { name: "Snap peas", category: "produce", unit: "g", packageAmount: 200, packageLabel: "200 g pack", pricePhp: 95 },
  "cherry tomatoes": { name: "Cherry tomatoes", category: "produce", unit: "g", packageAmount: 250, packageLabel: "250 g pack", pricePhp: 85 },
  "red onion": { name: "Red onion", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 14 },
  "apples": { name: "Apples", category: "produce", unit: "pc", packageAmount: 1, packageLabel: "1 pc", pricePhp: 25 },

  // Protein -----------------------------------------------------------------
  "chicken thighs": { name: "Chicken thighs", category: "protein", unit: "g", packageAmount: 500, packageLabel: "500 g pack", pricePhp: 145 },
  "salmon fillets": { name: "Salmon fillets", category: "protein", unit: "pc", packageAmount: 1, packageLabel: "1 pc (~150 g)", pricePhp: 180 },
  "canned tuna": { name: "Canned tuna", category: "protein", unit: "pc", packageAmount: 1, packageLabel: "1 can (155 g)", pricePhp: 45 },
  "firm tofu": { name: "Firm tofu", category: "protein", unit: "g", packageAmount: 350, packageLabel: "350 g pack", pricePhp: 35 },

  // Dairy ---------------------------------------------------------------
  "almond milk": { name: "Almond milk", category: "dairy", unit: "ml", packageAmount: 1000, packageLabel: "1 L carton", pricePhp: 180 },
  "eggs": { name: "Eggs", category: "dairy", unit: "pc", packageAmount: 12, packageLabel: "12-pc tray", pricePhp: 95 },
  "greek yogurt": { name: "Greek yogurt", category: "dairy", unit: "g", packageAmount: 400, packageLabel: "400 g tub", pricePhp: 210 },
  "feta": { name: "Feta", category: "dairy", unit: "g", packageAmount: 200, packageLabel: "200 g pack", pricePhp: 240 },

  // Grains ---------------------------------------------------------------
  "rolled oats": { name: "Rolled oats", category: "grains", unit: "g", packageAmount: 500, packageLabel: "500 g pack", pricePhp: 145 },
  "sourdough bread": { name: "Sourdough bread", category: "grains", unit: "pc", packageAmount: 1, packageLabel: "1 loaf", pricePhp: 150 },
  "granola": { name: "Granola", category: "grains", unit: "g", packageAmount: 300, packageLabel: "300 g pack", pricePhp: 175 },
  "quinoa": { name: "Quinoa", category: "grains", unit: "g", packageAmount: 400, packageLabel: "400 g pack", pricePhp: 260 },
  "sushi rice": { name: "Sushi rice", category: "grains", unit: "g", packageAmount: 1000, packageLabel: "1 kg pack", pricePhp: 95 },
  "egg noodles": { name: "Egg noodles", category: "grains", unit: "pc", packageAmount: 4, packageLabel: "4-nest pack", pricePhp: 65 },
  "pita bread": { name: "Pita bread", category: "grains", unit: "pc", packageAmount: 6, packageLabel: "6-pc pack", pricePhp: 75 },

  // Pantry — scales with recipe use (canned/perishable-ish) ------------------
  "red lentils": { name: "Red lentils", category: "pantry", unit: "g", packageAmount: 500, packageLabel: "500 g pack", pricePhp: 110 },
  "chopped tomatoes": { name: "Chopped tomatoes", category: "pantry", unit: "pc", packageAmount: 1, packageLabel: "1 can (400 g)", pricePhp: 45 },
  "chickpeas": { name: "Chickpeas", category: "pantry", unit: "pc", packageAmount: 1, packageLabel: "1 can (400 g)", pricePhp: 48 },
  "coconut milk": { name: "Coconut milk", category: "pantry", unit: "pc", packageAmount: 1, packageLabel: "1 can (400 ml)", pricePhp: 55 },
  "vegetable stock": { name: "Vegetable stock", category: "pantry", unit: "ml", packageAmount: 1000, packageLabel: "1 L pack", pricePhp: 85 },
  "kalamata olives": { name: "Kalamata olives", category: "pantry", unit: "g", packageAmount: 200, packageLabel: "200 g jar", pricePhp: 195 },
  "hummus": { name: "Hummus", category: "pantry", unit: "g", packageAmount: 200, packageLabel: "200 g tub", pricePhp: 135 },

  // Pantry — long shelf-life staples, assumed already partly stocked --------
  "chia seeds": { name: "Chia seeds", category: "pantry", unit: "ml", packageAmount: 200, packageLabel: "~200 ml pouch", pricePhp: 220, pantryStaple: true },
  "maple syrup": { name: "Maple syrup", category: "pantry", unit: "ml", packageAmount: 250, packageLabel: "250 ml bottle", pricePhp: 320, pantryStaple: true },
  "honey": { name: "Honey", category: "pantry", unit: "ml", packageAmount: 350, packageLabel: "350 ml jar", pricePhp: 185, pantryStaple: true },
  "chili flakes": { name: "Chili flakes", category: "pantry", unit: "ml", packageAmount: 50, packageLabel: "50 ml jar", pricePhp: 85, pantryStaple: true },
  "ground cumin": { name: "Ground cumin", category: "pantry", unit: "ml", packageAmount: 45, packageLabel: "45 ml jar", pricePhp: 75, pantryStaple: true },
  "smoked paprika": { name: "Smoked paprika", category: "pantry", unit: "ml", packageAmount: 45, packageLabel: "45 ml jar", pricePhp: 85, pantryStaple: true },
  "tahini": { name: "Tahini", category: "pantry", unit: "ml", packageAmount: 300, packageLabel: "300 ml jar", pricePhp: 280, pantryStaple: true },
  "curry powder": { name: "Curry powder", category: "pantry", unit: "ml", packageAmount: 90, packageLabel: "90 ml jar", pricePhp: 70, pantryStaple: true },
  "soy sauce": { name: "Soy sauce", category: "pantry", unit: "ml", packageAmount: 1000, packageLabel: "1 L bottle", pricePhp: 95, pantryStaple: true },
  "mirin": { name: "Mirin", category: "pantry", unit: "ml", packageAmount: 300, packageLabel: "300 ml bottle", pricePhp: 145, pantryStaple: true },
  "sesame oil": { name: "Sesame oil", category: "pantry", unit: "ml", packageAmount: 250, packageLabel: "250 ml bottle", pricePhp: 175, pantryStaple: true },
  "olive oil": { name: "Olive oil", category: "pantry", unit: "ml", packageAmount: 500, packageLabel: "500 ml bottle", pricePhp: 295, pantryStaple: true },
  "almond butter": { name: "Almond butter", category: "pantry", unit: "g", packageAmount: 250, packageLabel: "250 g jar", pricePhp: 380, pantryStaple: true },
  "cinnamon": { name: "Cinnamon", category: "pantry", unit: "g", packageAmount: 40, packageLabel: "40 g jar", pricePhp: 65, pantryStaple: true },
};
