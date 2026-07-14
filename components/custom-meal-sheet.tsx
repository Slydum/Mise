"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { MealType } from "@/lib/types";
import { MEAL_TYPE_LABELS } from "@/lib/types";

interface CustomMealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType | null;
  onSubmit: (name: string) => void;
}

/** Lightweight name-only meal entry for things that aren't a catalog recipe. */
export function CustomMealSheet({ open, onOpenChange, mealType, onSubmit }: CustomMealSheetProps) {
  const [name, setName] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setName("");
  }

  const trimmed = name.trim();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;
    onSubmit(trimmed);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Add custom meal</SheetTitle>
        <SheetDescription>
          {mealType
            ? `Just a name for ${MEAL_TYPE_LABELS[mealType].toLowerCase()} — no recipe needed.`
            : "Just a name — no recipe needed."}
        </SheetDescription>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 pb-6 pt-4">
          <Input
            autoFocus
            placeholder="e.g. Leftover pizza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Meal name"
          />
          <Button type="submit" disabled={!trimmed}>
            Add to plan
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
