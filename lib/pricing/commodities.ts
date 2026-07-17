/**
 * The official PSA/DTI commodity taxonomy and the mapping from Mise's
 * canonical ingredient keys (see lib/grocery/ingredient-catalog.ts) onto it.
 *
 * This is reference *taxonomy* — commodity names and categories PSA/DTI
 * publish, public knowledge about what gets tracked — not price data, so
 * curating it here isn't fabrication the way seeding a price would be. It's
 * deliberately conservative: coverage for anything not confidently a
 * standard PSA/DTI-monitored item is left `needsReview` (or unmapped
 * entirely) rather than guessed, and exact coverage should still be
 * reconciled against the live source once one is connected (see
 * lib/pricing/adapters/).
 *
 * Materially different commodities are always kept distinct — native vs.
 * imported garlic, red vs. white onion, well-milled vs. regular-milled
 * rice, fresh vs. canned tuna, salmon vs. tilapia. A missing mapping is
 * always `commodityName: null`, never a plausible-looking substitute.
 */

export type CommodityCategory =
  | "cereals"
  | "root crops"
  | "beans and legumes"
  | "condiments"
  | "fruit vegetables"
  | "leafy vegetables"
  | "fruits"
  | "fish"
  | "other";

export interface CommodityTaxonomyEntry {
  commodityName: string;
  category: CommodityCategory;
  unit: "kg" | "L" | "piece";
}

export const COMMODITY_TAXONOMY: CommodityTaxonomyEntry[] = [
  { commodityName: "Rice, Well Milled", category: "cereals", unit: "kg" },
  { commodityName: "Rice, Regular Milled", category: "cereals", unit: "kg" },
  { commodityName: "Carrot", category: "fruit vegetables", unit: "kg" },
  { commodityName: "Cabbage", category: "leafy vegetables", unit: "kg" },
  { commodityName: "Sweet Pepper (Bell Pepper)", category: "fruit vegetables", unit: "kg" },
  { commodityName: "Onion, Red", category: "condiments", unit: "kg" },
  { commodityName: "Onion, White", category: "condiments", unit: "kg" },
  { commodityName: "Garlic, Native", category: "condiments", unit: "kg" },
  { commodityName: "Garlic, Imported", category: "condiments", unit: "kg" },
  { commodityName: "Ginger", category: "condiments", unit: "kg" },
  { commodityName: "Tomato", category: "fruit vegetables", unit: "kg" },
  { commodityName: "Chickpeas (Garbanzos)", category: "beans and legumes", unit: "kg" },
  { commodityName: "Mung Bean", category: "beans and legumes", unit: "kg" },
  { commodityName: "Tilapia", category: "fish", unit: "kg" },
  { commodityName: "Bangus (Milkfish)", category: "fish", unit: "kg" },
  { commodityName: "Galunggong (Round Scad)", category: "fish", unit: "kg" },
  { commodityName: "Banana, Lakatan", category: "fruits", unit: "kg" },
  { commodityName: "Banana, Saba", category: "fruits", unit: "kg" },
  { commodityName: "Egg, Chicken", category: "other", unit: "piece" },
  { commodityName: "Sugar, Refined", category: "other", unit: "kg" },
  { commodityName: "Cooking Oil, Palm", category: "other", unit: "L" },
  { commodityName: "Soy Sauce", category: "condiments", unit: "L" },
];

export interface IngredientCommodityMapping {
  canonicalIngredientKey: string;
  /** null = no suitable official commodity exists — never substitute with a related item. */
  commodityName: string | null;
  needsReview: boolean;
  reason?: string;
}

function mapped(canonicalIngredientKey: string, commodityName: string): IngredientCommodityMapping {
  return { canonicalIngredientKey, commodityName, needsReview: false };
}

function review(canonicalIngredientKey: string, commodityName: string | null, reason: string): IngredientCommodityMapping {
  return { canonicalIngredientKey, commodityName, needsReview: true, reason };
}

const INGREDIENT_COMMODITY_MAP: Record<string, IngredientCommodityMapping> = {
  egg: mapped("egg", "Egg, Chicken"),
  carrot: mapped("carrot", "Carrot"),
  "bell pepper": mapped("bell pepper", "Sweet Pepper (Bell Pepper)"),
  "fresh ginger": mapped("fresh ginger", "Ginger"),
  "red onion": mapped("red onion", "Onion, Red"),
  tilapia: mapped("tilapia", "Tilapia"),
  bangus: mapped("bangus", "Bangus (Milkfish)"),
  chickpea: mapped("chickpea", "Chickpeas (Garbanzos)"),
  rice: mapped("rice", "Rice, Well Milled"),

  onion: review("onion", "Onion, Red", "PSA/DTI track red and white onion separately — confirm which your recipes mean."),
  garlic: review("garlic", "Garlic, Native", "Native and imported garlic are priced separately — confirm which you buy."),
  broccoli: review("broccoli", null, "PSA coverage for broccoli specifically isn't confirmed yet."),
  "red cabbage": review("red cabbage", null, "PSA tracks common cabbage, not red cabbage — not a safe substitute."),
  banana: review("banana", "Banana, Lakatan", "Banana varieties (Lakatan/Saba/Latundan) are priced separately — confirm which you buy."),
  "soy sauce": review("soy sauce", "Soy Sauce", "Confirm the DTI-monitored package size matches what you buy."),
  cucumber: review("cucumber", null, "PSA/DTI coverage for cucumber isn't confirmed yet."),
  "sushi rice": review("sushi rice", null, "Distinct from PSA's regular/well-milled rice — not a safe substitute."),
  "chicken thigh": review("chicken thigh", null, "PSA/DTI track whole dressed chicken, not specific cuts."),
  "salmon fillet": review("salmon fillet", null, "No official PSA/DTI commodity for salmon — do not substitute with tilapia or another fish."),
  "smoked salmon": review("smoked salmon", null, "No official commodity for smoked salmon."),
  "canned tuna": review("canned tuna", null, "Canned tuna isn't priced against fresh-fish commodity data."),
  "firm tofu": review("firm tofu", null, "No PSA/DTI commodity for tofu."),
  lemon: review("lemon", null, "PSA/DTI track calamansi, not lemon — not a safe substitute."),
  lime: review("lime", null, "PSA/DTI track calamansi, not lime — not a safe substitute."),
  avocado: review("avocado", null, "No PSA/DTI commodity for avocado."),
  quinoa: review("quinoa", null, "Imported specialty grain — no PSA/DTI commodity."),
  feta: review("feta", null, "Imported specialty item — no PSA/DTI commodity."),
  tahini: review("tahini", null, "Imported specialty item — no PSA/DTI commodity."),
  "coconut milk": review("coconut milk", null, "No PSA/DTI commodity for packaged coconut milk."),
  "vegetable stock": review("vegetable stock", null, "No PSA/DTI commodity for packaged stock."),
  hummus: review("hummus", null, "No PSA/DTI commodity for hummus."),
  "almond milk": review("almond milk", null, "Imported specialty item — no PSA/DTI commodity."),
  "almond butter": review("almond butter", null, "Imported specialty item — no PSA/DTI commodity."),
  granola: review("granola", null, "No PSA/DTI commodity for granola."),
  honey: review("honey", null, "No PSA/DTI commodity for honey."),
};

export function getCommodityMapping(canonicalIngredientKey: string): IngredientCommodityMapping | undefined {
  return INGREDIENT_COMMODITY_MAP[canonicalIngredientKey];
}

/** Every mapping that still needs a human decision before it's used for pricing — feeds the mapping-review screen. */
export function listMappingsNeedingReview(): IngredientCommodityMapping[] {
  return Object.values(INGREDIENT_COMMODITY_MAP).filter((m) => m.needsReview);
}
