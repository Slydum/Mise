import { SM_PACKAGES, type RetailPackage } from "@/lib/grocery/sm-packages";

/**
 * Canonical ingredient identity, kept separate from the display name shown
 * on a recipe or grocery line. Two names normalize to the same canonical key
 * when they're the same word in singular/plural form, or when they're a
 * known alias of each other (see ALIASES below).
 *
 * Deliberately does NOT strip descriptive qualifiers ("red", "fresh",
 * "large") — "red onion" and "onion" get different canonical keys, because
 * they're genuinely different purchases. Blind qualifier-stripping risks
 * merging things that shouldn't merge; only exact matches (after
 * singularizing) and the explicit alias table narrow what combines.
 */

// Words that already look plural (end in "s") but aren't — singularizing
// them would be wrong, so they pass through unchanged.
const FALSE_PLURALS = new Set(["hummus", "asparagus", "couscous", "molasses", "chives"]);

// Common alternate names for the same ingredient. Keys and values are both
// already-normalized (lowercase); each alias maps to its canonical form.
const ALIASES: Record<string, string> = {
  coriander: "cilantro",
  "coriander leaf": "cilantro",
  scallion: "spring onion",
  "green onion": "spring onion",
  garbanzo: "chickpea",
  "garbanzo bean": "chickpea",
  capsicum: "bell pepper",
  "sweet pepper": "bell pepper",
  aubergine: "eggplant",
  "corn starch": "cornstarch",
};

function singularize(word: string): string {
  if (FALSE_PLURALS.has(word)) return word;
  if (word.endsWith("ies") && word.length > 3) return `${word.slice(0, -3)}y`;
  if (/(oes|shes|ches|xes|ses)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/** Case/whitespace-normalized, singularized, alias-resolved identity for combining ingredients across recipes. */
export function getCanonicalKey(name: string): string {
  const normalized = name.trim().toLowerCase();
  const singular = singularize(normalized);
  return ALIASES[singular] ?? ALIASES[normalized] ?? singular;
}

export interface IngredientCatalogEntry {
  canonicalKey: string;
  shelfLife: "perishable" | "pantry";
  packages: RetailPackage[];
}

/** Shelf-life hints for the curated set — used to distinguish staples from perishables. Unlisted keys default to "perishable" (safer default: don't silently treat an unknown item as a pantry-stocked staple). */
const PANTRY_STAPLES = new Set([
  "rice",
  "cooking oil",
  "soy sauce",
  "canned tuna",
  "powdered milk",
  "pasta",
  "garlic",
  "fish sauce",
  "vinegar",
  "shrimp paste",
  "bay leaf",
  "peppercorn",
  "sinigang mix",
  "mung bean",
  "flour",
  "rice noodle",
  "chicken stock",
]);

export function getCatalogEntry(canonicalKey: string): IngredientCatalogEntry {
  return {
    canonicalKey,
    shelfLife: PANTRY_STAPLES.has(canonicalKey) ? "pantry" : "perishable",
    packages: SM_PACKAGES[canonicalKey] ?? [],
  };
}
