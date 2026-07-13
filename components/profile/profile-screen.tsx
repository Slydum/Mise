"use client";

import { Bell, ChevronRight, CloudOff, Heart, Ruler, Palette } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile } from "@/lib/data";
import { useData } from "@/lib/hooks/use-data";
import { useFavorites } from "@/lib/hooks/use-favorites";

const SETTINGS = [
  { icon: Bell, label: "Notifications", hint: "Meal reminders" },
  { icon: Ruler, label: "Units", hint: "Metric" },
  { icon: Palette, label: "Appearance", hint: "Warm" },
] as const;

export function ProfileScreen() {
  const profile = useData(getProfile);
  const { favorites } = useFavorites();
  const savedCount = Object.keys(favorites).length;

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
              </dl>
            </CardContent>
          </Card>

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

          <p className="pb-2 text-center text-xs text-muted-foreground">Mise v0.2.0</p>
        </div>
      )}
    </div>
  );
}
