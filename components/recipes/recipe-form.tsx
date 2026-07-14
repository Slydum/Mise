"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ClipboardPaste, Plus, X } from "lucide-react";
import { PasteRecipeSheet } from "@/components/recipes/paste-recipe-sheet";
import { ServingsStepper } from "@/components/recipes/servings-stepper";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveCreatedRecipe } from "@/lib/data/plan-overrides";
import { compressImageFile } from "@/lib/image";
import type { ParsedRecipe } from "@/lib/recipe-parser";
import type { GroceryCategory, MealType, RecipeTag } from "@/lib/types";
import { MEAL_TYPE_LABELS, MEAL_TYPES, RECIPE_TAG_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const CREATABLE_TAGS: RecipeTag[] = [
  "vegan",
  "vegetarian",
  "pescatarian",
  "high-protein",
  "quick",
  "gluten-free",
  "dairy-free",
  "contains-eggs",
  "comfort",
];

interface IngredientDraft {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface StepDraft {
  id: string;
  text: string;
}

let draftIdCounter = 0;
function nextDraftId(): string {
  draftIdCounter += 1;
  return `draft-${draftIdCounter}`;
}

function chipClass(active: boolean): string {
  return cn(
    "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
  );
}

const DEFAULT_INGREDIENT_CATEGORY: GroceryCategory = "other";

/** Fast recipe-creation form: photo, ingredients/steps, tags, servings/time, optional nutrition. */
export function RecipeForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [mealTypes, setMealTypes] = useState<MealType[]>([]);
  const [tags, setTags] = useState<RecipeTag[]>([]);
  const [servings, setServings] = useState(2);
  const [prepMinutes, setPrepMinutes] = useState(10);
  const [cookMinutes, setCookMinutes] = useState(0);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([
    { id: nextDraftId(), name: "", amount: "1", unit: "" },
  ]);
  const [steps, setSteps] = useState<StepDraft[]>([{ id: nextDraftId(), text: "" }]);
  const [showNutrition, setShowNutrition] = useState(false);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file);
    setImageUrl(compressed);
  };

  const toggleMealType = (type: MealType) =>
    setMealTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  const toggleTag = (tag: RecipeTag) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const updateIngredient = (id: string, patch: Partial<IngredientDraft>) =>
    setIngredients((prev) => prev.map((ing) => (ing.id === id ? { ...ing, ...patch } : ing)));
  const addIngredient = () =>
    setIngredients((prev) => [...prev, { id: nextDraftId(), name: "", amount: "1", unit: "" }]);
  const removeIngredient = (id: string) => setIngredients((prev) => prev.filter((ing) => ing.id !== id));

  const updateStep = (id: string, text: string) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
  const addStep = () => setSteps((prev) => [...prev, { id: nextDraftId(), text: "" }]);
  const removeStep = (id: string) => setSteps((prev) => prev.filter((s) => s.id !== id));

  const handleParsed = (parsed: ParsedRecipe) => {
    if (parsed.ingredients.length > 0) {
      setIngredients((prev) => {
        const meaningful = prev.filter((i) => i.name.trim());
        return [
          ...meaningful,
          ...parsed.ingredients.map((i) => ({
            id: nextDraftId(),
            name: i.name,
            amount: String(i.amount),
            unit: i.unit,
          })),
        ];
      });
    }
    if (parsed.steps.length > 0) {
      setSteps((prev) => {
        const meaningful = prev.filter((s) => s.text.trim());
        return [...meaningful, ...parsed.steps.map((text) => ({ id: nextDraftId(), text }))];
      });
    }
  };

  const canSave = title.trim().length > 0 && !saving;

  const handleSave = () => {
    if (!canSave) return;
    setSaving(true);
    const recipe = saveCreatedRecipe({
      title,
      description,
      imageUrl,
      emoji: "🍽️",
      mealTypes,
      tags,
      prepMinutes,
      cookMinutes,
      servings,
      nutrition: {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
      },
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          amount: Number(i.amount) || 1,
          unit: i.unit.trim(),
          category: DEFAULT_INGREDIENT_CATEGORY,
        })),
      steps: steps.map((s) => s.text.trim()).filter(Boolean),
    });
    router.push(`/recipes/custom?id=${recipe.id}`);
  };

  return (
    <div className="flex flex-col gap-6 pb-8 animate-fade-up">
      <ScreenHeader title="New Recipe" subtitle="For your cookbook">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/recipes">Cancel</Link>
        </Button>
      </ScreenHeader>

      <div className="flex flex-col gap-6 px-5">
        <label className="relative flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground outline-none transition-colors duration-150 focus-within:ring-2 focus-within:ring-ring">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1.5">
              <Camera className="size-6" aria-hidden />
              <span className="text-sm font-medium">Add a photo</span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={handlePhotoChange}
          />
        </label>

        <div className="flex flex-col gap-3">
          <Input
            placeholder="Recipe name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Recipe name"
          />
          <Textarea
            placeholder="Short description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            aria-label="Description"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Meal category</p>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleMealType(type)}
                className={chipClass(mealTypes.includes(type))}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">Dietary tags</p>
          <div className="flex flex-wrap gap-2">
            {CREATABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={chipClass(tags.includes(tag))}
              >
                {RECIPE_TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Servings</p>
            <ServingsStepper value={servings} onChange={setServings} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Prep (min)
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={prepMinutes}
                onChange={(e) => setPrepMinutes(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-semibold">
              Cook (min)
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={cookMinutes}
                onChange={(e) => setCookMinutes(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-2xl">Ingredients</h2>
            <Button variant="ghost" size="sm" onClick={() => setPasteOpen(true)}>
              <ClipboardPaste className="size-4" aria-hidden />
              Paste a recipe
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center gap-2">
                <Input
                  className="w-16 shrink-0 px-2 text-center"
                  inputMode="decimal"
                  placeholder="1"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(ing.id, { amount: e.target.value })}
                  aria-label="Amount"
                />
                <Input
                  className="w-20 shrink-0 px-2"
                  placeholder="unit"
                  value={ing.unit}
                  onChange={(e) => updateIngredient(ing.id, { unit: e.target.value })}
                  aria-label="Unit"
                />
                <Input
                  className="flex-1"
                  placeholder="Ingredient"
                  value={ing.name}
                  onChange={(e) => updateIngredient(ing.id, { name: e.target.value })}
                  aria-label="Ingredient name"
                />
                <button
                  type="button"
                  onClick={() => removeIngredient(ing.id)}
                  aria-label="Remove ingredient"
                  className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                >
                  <X className="size-4.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addIngredient}>
            <Plus className="size-4" aria-hidden />
            Add ingredient
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-2xl">Instructions</h2>
          <div className="flex flex-col gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-3 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground"
                >
                  {index + 1}
                </span>
                <Textarea
                  className="flex-1"
                  rows={2}
                  placeholder="Describe this step"
                  value={step.text}
                  onChange={(e) => updateStep(step.id, e.target.value)}
                  aria-label={`Step ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeStep(step.id)}
                  aria-label="Remove step"
                  className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-2xl text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                >
                  <X className="size-4.5" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={addStep}>
            <Plus className="size-4" aria-hidden />
            Add step
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowNutrition((v) => !v)}
            className="flex items-center justify-between text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h2 className="font-serif text-2xl">Nutrition</h2>
            <span className="text-sm text-muted-foreground">
              {showNutrition ? "Hide" : "Add (optional)"}
            </span>
          </button>
          {showNutrition ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Calories
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Protein (g)
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Carbs (g)
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold">
                Fat (g)
                <Input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>

        <Button size="lg" variant="highlight" onClick={handleSave} disabled={!canSave}>
          Save recipe
        </Button>
      </div>

      <PasteRecipeSheet open={pasteOpen} onOpenChange={setPasteOpen} onParsed={handleParsed} />
    </div>
  );
}
