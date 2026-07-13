import type { MealType } from "@/lib/types";
import { MEAL_TYPE_EMOJI, MEAL_TYPE_LABELS } from "@/lib/types";

interface MealTypeEyebrowProps {
  mealType: MealType;
}

/**
 * Small "🍳 BREAKFAST" label. The emoji is deliberately outside the
 * uppercase-styled text: `text-transform: uppercase` applies Unicode case
 * folding to all descendant text, and some Chromium builds mis-map
 * supplementary-plane emoji codepoints when it's applied to them directly,
 * rendering an unrelated glyph.
 */
export function MealTypeEyebrow({ mealType }: MealTypeEyebrowProps) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span aria-hidden>{MEAL_TYPE_EMOJI[mealType]}</span>
      <span className="uppercase tracking-wide">{MEAL_TYPE_LABELS[mealType]}</span>
    </span>
  );
}
