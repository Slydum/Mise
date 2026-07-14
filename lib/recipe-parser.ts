/**
 * Best-effort "paste a recipe" text parser. No LLM/backend is available (this
 * is a static-export PWA with no server), so this is a heuristic line
 * classifier — it prefills the create-recipe form for the user to review and
 * correct, not a guaranteed-accurate extraction.
 */

export interface ParsedIngredient {
  amount: number;
  unit: string;
  name: string;
}

export interface ParsedRecipe {
  ingredients: ParsedIngredient[];
  steps: string[];
}

const SECTION_HEADERS = {
  ingredients: /^ingredients?:?$/i,
  instructions: /^(instructions?|directions?|method|steps?):?$/i,
};

const FRACTION_GLYPHS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅕": 0.2,
  "⅛": 0.125,
};

const KNOWN_UNITS = [
  "g", "kg", "ml", "l", "tbsp", "tsp", "cup", "cups", "oz", "lb", "lbs",
  "clove", "cloves", "slice", "slices", "can", "cans", "bunch", "bunches",
  "head", "heads", "pinch", "pinches", "jar", "jars", "bottle", "bottles",
  "bag", "bags", "pack", "packs", "dozen", "piece", "pieces",
];
const UNIT_PATTERN = new RegExp(`^(${KNOWN_UNITS.join("|")})\\b\\.?\\s*(.*)$`, "i");

function stripBullet(line: string): string {
  return line.replace(/^[-*•]\s*/, "");
}

function stripListNumbering(line: string): string {
  return stripBullet(line.replace(/^(step\s*)?\d+[.):]\s*/i, "")).trim();
}

function parseLeadingAmount(text: string): { amount: number; rest: string } | null {
  const trimmed = text.trim();
  // mixed number, e.g. "1 1/2 cups"
  let m = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/);
  if (m) return { amount: Number(m[1]) + Number(m[2]) / Number(m[3]), rest: m[4] };
  // simple fraction, e.g. "1/2 cup"
  m = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (m) return { amount: Number(m[1]) / Number(m[2]), rest: m[3] };
  // unicode fraction glyph, optional leading whole number, e.g. "1½ cups" or "½ cup"
  m = trimmed.match(/^(\d+)?([½¼¾⅓⅔⅕⅛])\s*(.*)$/);
  if (m) return { amount: (m[1] ? Number(m[1]) : 0) + FRACTION_GLYPHS[m[2]], rest: m[3] };
  // decimal or integer, e.g. "2.5 cups" or "3 eggs"
  m = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if (m) return { amount: Number(m[1]), rest: m[2] };
  return null;
}

function capitalize(text: string): string {
  return text.length > 0 ? text[0].toUpperCase() + text.slice(1) : text;
}

function looksLikeIngredient(line: string): boolean {
  return Boolean(parseLeadingAmount(stripBullet(line))) && line.length < 80;
}

function parseIngredientLine(line: string): ParsedIngredient {
  const stripped = stripBullet(line);
  const parsed = parseLeadingAmount(stripped);
  if (!parsed) return { amount: 1, unit: "", name: capitalize(stripped) };
  const rest = parsed.rest.trim();
  const unitMatch = rest.match(UNIT_PATTERN);
  if (unitMatch) {
    return {
      amount: parsed.amount,
      unit: unitMatch[1].toLowerCase().replace(/s$/, ""),
      name: capitalize(unitMatch[2].trim()),
    };
  }
  return { amount: parsed.amount, unit: "", name: capitalize(rest) };
}

export function parseRecipeText(text: string): ParsedRecipe {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const ingHeaderIdx = lines.findIndex((l) => SECTION_HEADERS.ingredients.test(l));
  const instrHeaderIdx = lines.findIndex((l) => SECTION_HEADERS.instructions.test(l));

  let ingredientLines: string[];
  let instructionLines: string[];

  if (ingHeaderIdx !== -1 && instrHeaderIdx !== -1 && instrHeaderIdx > ingHeaderIdx) {
    ingredientLines = lines.slice(ingHeaderIdx + 1, instrHeaderIdx);
    instructionLines = lines.slice(instrHeaderIdx + 1);
  } else {
    ingredientLines = [];
    instructionLines = [];
    for (const line of lines) {
      if (SECTION_HEADERS.ingredients.test(line) || SECTION_HEADERS.instructions.test(line)) continue;
      (looksLikeIngredient(line) ? ingredientLines : instructionLines).push(line);
    }
  }

  return {
    ingredients: ingredientLines.map(parseIngredientLine),
    steps: instructionLines.map(stripListNumbering).filter(Boolean),
  };
}
