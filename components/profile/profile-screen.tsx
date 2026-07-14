"use client";

import { Bell, ChevronRight, CloudOff, Heart, Ruler, Palette } from "lucide-react";
import { DietStyleSelector } from "@/components/profile/diet-style-selector";
import { ShoppingSettingsCard } from "@/components/profile/shopping-settings-card";
import { TagEditor } from "@/components/profile/tag-editor";
import { ScreenHeader } from "@/components/screen-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { getProfile } from "@/lib/data";
import { useData } from "@/lib/hooks/use-data";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import { useShoppingSettings } from "@/lib/hooks/use-shopping-settings";
import { useToast } from "@/lib/hooks/use-toast";
import type { DietaryStyle } from "@/lib/types";

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
    addAllergy,
    removeAllergy,
    addExcluded,
    removeExcluded,
    addFavorite,
    removeFavorite,
  } = useFoodPreferences();
  const { settings: shoppingSettings, updateSettings: updateShoppingSettings, setStore } = useShoppingSettings();
  const savedCount = Object.keys(favorites).length;
  const { message: toastMessage, showToast } = useToast();

  const handleDietChange = (style: DietaryStyle) => {
    setDietaryStyle(style);
    showToast("Saved");
  };
  const withToast =
    <T,>(fn: (value: T) => void) =>
    (value: T) => {
      fn(value);
      showToast("Saved");
    };

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
                <DietStyleSelector value={dietaryStyle} onChange={handleDietChange} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                <TagEditor
                  values={allergies}
                  onAdd={withToast(addAllergy)}
                  onRemove={withToast(removeAllergy)}
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
                  onAdd={withToast(addExcluded)}
                  onRemove={withToast(removeExcluded)}
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
                  onAdd={withToast(addFavorite)}
                  onRemove={withToast(removeFavorite)}
                  placeholder="e.g. salmon"
                  emptyHint="Add ingredients you love and we'll prioritize recipes that use them."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-xl font-normal">Daily goals</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="rounded-2xl bg-muted/60 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">Calories</dt>
                    <dd className="text-lg font-semibold">{profile.goals.calories.toLocaleString()}</dd>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-3">
                    <dt className="text-xs font-medium text-muted-foreground">Protein</dt>
                    <dd className="text-lg font-semibold">{profile.goals.protein} g</dd>
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
                <CardTitle className="font-serif text-xl font-normal">SM Markets &amp; budget</CardTitle>
              </CardHeader>
              <CardContent>
                <ShoppingSettingsCard
                  settings={shoppingSettings}
                  onChange={withToast(updateShoppingSettings)}
                  onSetStore={(storeName, storeCity, storeAddress) => {
                    setStore(storeName, storeCity, storeAddress);
                    showToast("Store saved");
                  }}
                />
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

      <Toast message={toastMessage} />
    </div>
  );
}
