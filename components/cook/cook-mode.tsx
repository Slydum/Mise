"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, PartyPopper, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearActiveCook, loadActiveCook, saveActiveCook } from "@/lib/data/local-store";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CookModeProps {
  recipe: Recipe;
}

/**
 * Full-screen, distraction-free cooking mode. Huge type, giant prev/next
 * controls at the bottom of the screen for one-handed (or knuckle) use.
 */
export function CookMode({ recipe }: CookModeProps) {
  const router = useRouter();
  // Resume mid-recipe if this is the recipe the user last left off on;
  // otherwise (or on the server) always start at step 0.
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const active = loadActiveCook();
    if (active?.recipeId === recipe.id) setStepIndex(active.stepIndex);
  }, [recipe.id]);

  const steps = recipe.steps;
  const done = stepIndex >= steps.length;
  const step = done ? null : steps[stepIndex];

  // Persist progress as the user moves through steps so Today can offer
  // "Continue cooking" if they leave before finishing.
  useEffect(() => {
    if (!done) saveActiveCook(recipe.id, stepIndex);
  }, [recipe.id, stepIndex, done]);

  const exit = () => router.push(`/recipes/${recipe.id}`);
  const finish = () => {
    clearActiveCook();
    exit();
  };

  return (
    <div className="fixed inset-0 z-50 mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background pt-safe pb-safe">
      <header className="flex items-center gap-4 px-5 py-3">
        <Button variant="secondary" size="icon" onClick={exit} aria-label="Exit cooking mode">
          <X aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{recipe.title}</p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {done ? "Finished" : `Step ${stepIndex + 1} of ${steps.length}`}
          </p>
        </div>
      </header>

      <div
        className="flex gap-1.5 px-5"
        role="progressbar"
        aria-label="Cooking progress"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={Math.min(stepIndex + 1, steps.length)}
      >
        {steps.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              i <= stepIndex || done ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <main className="flex flex-1 flex-col justify-center gap-6 overflow-y-auto px-6 py-8">
        {done ? (
          <div className="flex flex-col items-center gap-4 text-center animate-scale-in">
            <span className="flex size-20 items-center justify-center rounded-full bg-accent">
              <PartyPopper className="size-9 text-primary" aria-hidden />
            </span>
            <h2 className="font-serif text-3xl tracking-tight">All done!</h2>
            <p className="text-lg text-muted-foreground">
              Enjoy your {recipe.title.toLowerCase()}.
            </p>
          </div>
        ) : step ? (
          <div key={step.id} className="flex flex-col gap-5 animate-fade-up">
            {step.durationMinutes ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-foreground">
                <Timer className="size-4" aria-hidden />
                About {step.durationMinutes} min
              </span>
            ) : null}
            <p className="font-serif text-3xl leading-snug tracking-tight">
              {step.instruction}
            </p>
          </div>
        ) : null}
      </main>

      <footer className="flex gap-3 px-5 pb-4">
        {done ? (
          <Button variant="highlight" size="lg" className="flex-1" onClick={finish}>
            Finish
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              aria-label="Previous step"
            >
              <ChevronLeft aria-hidden />
              Back
            </Button>
            <Button
              variant="highlight"
              size="lg"
              className="flex-[2]"
              onClick={() => setStepIndex((i) => i + 1)}
              aria-label={stepIndex === steps.length - 1 ? "Finish cooking" : "Next step"}
            >
              {stepIndex === steps.length - 1 ? "Done" : "Next"}
              <ChevronRight aria-hidden />
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}
