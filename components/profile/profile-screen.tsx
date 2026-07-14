"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronRight, CloudOff, Heart, Ruler, Palette } from "lucide-react";
import { BudgetSelector } from "@/components/profile/budget-selector";
import { DietStyleSelector } from "@/components/profile/diet-style-selector";
import { TagEditor } from "@/components/profile/tag-editor";
import { ScreenHeader } from "@/components/screen-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile } from "@/lib/data";
import { useData } from "@/lib/hooks/use-data";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import { useShoppingPreferences } from "@/lib/hooks/use-shopping-preferences";

const SM_BRANCHES = [
  "SM Fairview",
  "SM North EDSA",
  "SM Megamall",
  "SM Mall of Asia",
  "SM Southmall",
  "SM Aura Premier",
  "SM Manila",
  "SM Marikina",
  "SM City Cebu",
  "SM City Davao",
] as const;

const SETTINGS = [
  { icon: Bell, label: "Notifications", hint: "Meal reminders" },
  { icon: Ruler, label: "Units", hint: "Metric" },
  { icon: Palette, label: "Appearance", hint: "Warm" },
] as const;

export function ProfileScreen() {
  const profile = useData(getProfile);
  const { favorites } = useFavorites();
  const { dietaryStyle, setDietaryStyle } = useDietaryStyle();
  const {
    allergies,
    excludedIngredients,
    favoriteIngredients,
    preferredCuisines,
    maxCookMinutes,
    budgetPreference,
    servings,
    calorieGoal,
    proteinGoal,
    addAllergy,
    removeAllergy,
    addExcluded,
    removeExcluded,
    addFavorite,
    removeFavorite,
    addPreferredCuisine,
    removePreferredCuisine,
    setMaxCookMinutes,
    setBudgetPreference,
    setServings,
    setCalorieGoal,
    setProteinGoal,
  } = useFoodPreferences();
  const { preferredSmBranch, weeklyGroceryBudget, setPreferredSmBranch, setWeeklyGroceryBudget } =
    useShoppingPreferences();
  const savedCount = Object.keys(favorites).length;

  // Local drafts so clearing a field to retype a new value doesn't
  // immediately snap back to a fallback number on every keystroke.
  const [servingsDraft, setServingsDraft] = useState(String(servings));
  useEffect(() => setServingsDraft(String(servings)), [servings]);
  // `profile` is null until it loads, so these fall back to 0 only for that
  // brief instant — the fields they back aren't rendered until it's ready.
  const effectiveCalorieGoal = calorieGoal ?? profile?.goals.calories ?? 0;
  const [calorieGoalDraft, setCalorieGoalDraft] = useState(String(effectiveCalorieGoal));
  useEffect(() => setCalorieGoalDraft(String(effectiveCalorieGoal)), [effectiveCalorieGoal]);
  const effectiveProteinGoal = proteinGoal ?? profile?.goals.protein ?? 0;
  const [proteinGoalDraft, setProteinGoalDraft] = useState(String(effectiveProteinGoal));
  useEffect(() => setProteinGoalDraft(String(effectiveProteinGoal)), [effectiveProteinGoal]);
  const effectiveWeeklyBudget = weeklyGroceryBudget ?? profile?.weeklyGroceryBudgetPhp ?? 0;
  const [weeklyBudgetDraft, setWeeklyBudgetDraft] = useState(String(effectiveWeeklyBudget));
  useEffect(() => setWeeklyBudgetDraft(String(effectiveWeeklyBudget)), [effectiveWeeklyBudget]);

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader title="Profile" />

      {!profile ? (
        <div className="flex flex-col gap-4 px-5" aria-hidden>
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-5">
          <Card>
            <CardContent className="flex items-center gap-4">
              <span
                aria-hidden
                className="flex size-16 items-center justify-center rounded-full bg-primary font-serif text-2xl text-primary-foreground"
              >
                {profile.name.charAt(0)}
              </span>
              <div>
                <p className="font-serif text-xl tracking-tight">{profile.name}</p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CloudOff className="size-3.5" aria-hidden />
                  Local only — sign-in coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-highlight-tint text-highlight">
                <Heart className="size-4.5" aria-hidden />
              </span>
              <p className="flex-1 font-medium">
                {savedCount} {savedCount === 1 ? "recipe" : "recipes"} saved
              </p>
            </CardContent>
          </Card>

          <section className="flex flex-col gap-4">
            <h2 className="px-1 font-serif text-2xl">Food Preferences</h2>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Eating style</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DietStyleSelector value={dietaryStyle} onChange={setDietaryStyle} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                <TagEditor
                  values={allergies}
                  onAdd={addAllergy}
                  onRemove={removeAllergy}
                  placeholder="e.g. peanuts"
                  emptyHint="No allergies added. We'll warn you before you open a recipe that contains one."
                  chipVariant="warning"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Excluded ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <TagEditor
                  values={excludedIngredients}
                  onAdd={addExcluded}
                  onRemove={removeExcluded}
                  placeholder="e.g. cilantro"
                  emptyHint="Nothing excluded. Add ingredients you'd rather not see suggested."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Favorite ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <TagEditor
                  values={favoriteIngredients}
                  onAdd={addFavorite}
                  onRemove={removeFavorite}
                  placeholder="e.g. salmon"
                  emptyHint="Add ingredients you love and we'll prioritize recipes that use them."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Preferred cuisines</CardTitle>
              </CardHeader>
              <CardContent>
                <TagEditor
                  values={preferredCuisines}
                  onAdd={addPreferredCuisine}
                  onRemove={removePreferredCuisine}
                  placeholder="e.g. Japanese"
                  emptyHint="Add cuisines you love and we'll prioritize recipes that match."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Cooking preferences</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div>
                  <label htmlFor="max-cook-time" className="mb-2 block text-sm font-medium">
                    Max cooking time
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="max-cook-time"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={5}
                      placeholder="No limit"
                      value={maxCookMinutes ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setMaxCookMinutes(raw === "" ? null : Math.max(0, Number(raw) || 0));
                      }}
                      className="max-w-32"
                    />
                    <span className="text-sm text-muted-foreground">minutes total</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    A preference, not a hard cutoff — we'll favor quicker recipes but won't rule out others.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Budget</p>
                  <BudgetSelector value={budgetPreference} onChange={setBudgetPreference} />
                </div>

                <div>
                  <label htmlFor="servings" className="mb-2 block text-sm font-medium">
                    People served
                  </label>
                  <Input
                    id="servings"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={12}
                    value={servingsDraft}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setServingsDraft(raw);
                      const n = Number(raw);
                      if (raw !== "" && Number.isFinite(n)) setServings(Math.min(12, Math.max(1, n)));
                    }}
                    onBlur={() => setServingsDraft(String(servings))}
                    className="max-w-32"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Daily goals</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="rounded-2xl bg-muted/60 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">
                      <label htmlFor="calorie-goal">Calories</label>
                    </dt>
                    <dd>
                      <Input
                        id="calorie-goal"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={50}
                        value={calorieGoalDraft}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setCalorieGoalDraft(raw);
                          if (raw === "") setCalorieGoal(null);
                          else if (Number.isFinite(Number(raw))) setCalorieGoal(Math.max(0, Number(raw)));
                        }}
                        onBlur={() => setCalorieGoalDraft(String(effectiveCalorieGoal))}
                        className="h-10 text-lg font-semibold"
                      />
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">
                      <label htmlFor="protein-goal">Protein (g)</label>
                    </dt>
                    <dd>
                      <Input
                        id="protein-goal"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={5}
                        value={proteinGoalDraft}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setProteinGoalDraft(raw);
                          if (raw === "") setProteinGoal(null);
                          else if (Number.isFinite(Number(raw))) setProteinGoal(Math.max(0, Number(raw)));
                        }}
                        onBlur={() => setProteinGoalDraft(String(effectiveProteinGoal))}
                        className="h-10 text-lg font-semibold"
                      />
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">Carbs</dt>
                    <dd className="text-lg font-semibold">{profile.goals.carbs} g</dd>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">Fat</dt>
                    <dd className="text-lg font-semibold">{profile.goals.fat} g</dd>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-muted/60 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">Water</dt>
                    <dd className="text-lg font-semibold">{(profile.waterGoalMl / 1000).toFixed(1)} L</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="px-1 font-serif text-2xl">Shopping</h2>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">SM Markets</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div>
                  <label htmlFor="sm-branch" className="mb-2 block text-sm font-medium">
                    Preferred branch
                  </label>
                  <select
                    id="sm-branch"
                    value={preferredSmBranch ?? profile.preferredSmBranch}
                    onChange={(e) => setPreferredSmBranch(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {SM_BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="weekly-budget" className="mb-2 block text-sm font-medium">
                    Weekly grocery budget
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₱</span>
                    <Input
                      id="weekly-budget"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={100}
                      value={weeklyBudgetDraft}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setWeeklyBudgetDraft(raw);
                        if (raw === "") setWeeklyGroceryBudget(null);
                        else if (Number.isFinite(Number(raw)))
                          setWeeklyGroceryBudget(Math.max(0, Number(raw)));
                      }}
                      onBlur={() => setWeeklyBudgetDraft(String(effectiveWeeklyBudget))}
                      className="max-w-32"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Used to show how much of your weekly budget is left on the Grocery tab.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardContent className="p-2">
              <ul>
                {SETTINGS.map(({ icon: Icon, label, hint }, index) => (
                  <li key={label}>
                    <button
                      type="button"
                      className="flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-3 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                      aria-label={`${label} settings`}
                    >
                      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Icon className="size-4.5" aria-hidden />
                      </span>
                      <span className="flex-1 font-medium">{label}</span>
                      <span className="text-sm text-muted-foreground">{hint}</span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </button>
                    {index < SETTINGS.length - 1 ? (
                      <div className="ml-14 border-t border-border/60" aria-hidden />
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <p className="pb-2 text-center text-xs text-muted-foreground">Mise v0.3.0</p>
        </div>
      )}
    </div>
  );
}
