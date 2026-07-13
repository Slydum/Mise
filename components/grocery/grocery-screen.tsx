"use client";

import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getGroceryList } from "@/lib/data";
import { loadCheckedItems, saveCheckedItems } from "@/lib/data/local-store";
import { useData } from "@/lib/hooks/use-data";
import type { GroceryCategory, GroceryItem } from "@/lib/types";
import { GROCERY_CATEGORY_LABELS, GROCERY_CATEGORY_ORDER } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_EMOJI: Record<GroceryCategory, string> = {
  produce: "🥬",
  protein: "🍖",
  dairy: "🥛",
  grains: "🍞",
  pantry: "🫙",
  frozen: "🧊",
  other: "🧺",
};

export function GroceryScreen() {
  const items = useData(getGroceryList);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Persisted state is client-only; hydrate after mount.
  useEffect(() => {
    setChecked(loadCheckedItems());
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCheckedItems(next);
      return next;
    });
  };

  const clearChecked = () => {
    setChecked({});
    saveCheckedItems({});
  };

  const sections = useMemo(() => {
    if (!items) return null;
    const byCategory = new Map<GroceryCategory, GroceryItem[]>();
    for (const item of items) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return GROCERY_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      items: byCategory.get(category)!,
    }));
  }, [items]);

  const total = items?.length ?? 0;
  const doneCount = items?.filter((i) => checked[i.id]).length ?? 0;
  const anyChecked = doneCount > 0;

  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <ScreenHeader title="Grocery" subtitle="This week's shop">
        {anyChecked ? (
          <Button variant="ghost" size="sm" onClick={clearChecked} className="text-muted-foreground">
            Clear
          </Button>
        ) : null}
      </ScreenHeader>

      {!sections ? (
        <div className="flex flex-col gap-4 px-5" aria-hidden>
          <Skeleton className="h-16 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <>
          <div className="mx-5 flex flex-col gap-2 rounded-3xl border border-border/60 bg-card p-5">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">
                {doneCount} of {total} items
              </p>
              <p className="text-sm text-muted-foreground">
                {total - doneCount === 0 ? "All done 🎉" : `${total - doneCount} to go`}
              </p>
            </div>
            <Progress
              value={total === 0 ? 0 : (doneCount / total) * 100}
              aria-label={`${doneCount} of ${total} grocery items checked`}
            />
          </div>

          <div className="flex flex-col gap-6 px-5">
            {sections.map(({ category, items: sectionItems }) => (
              <section key={category} aria-label={GROCERY_CATEGORY_LABELS[category]}>
                <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <span aria-hidden>{CATEGORY_EMOJI[category]}</span>
                  {GROCERY_CATEGORY_LABELS[category]}
                </h2>
                <ul className="overflow-hidden rounded-3xl border border-border/60 bg-card">
                  {sectionItems.map((item, index) => {
                    const isChecked = Boolean(checked[item.id]);
                    return (
                      <li
                        key={item.id}
                        className={cn(index > 0 && "border-t border-border/60")}
                      >
                        <label
                          className={cn(
                            "flex min-h-14 cursor-pointer items-center gap-3.5 px-4 py-2.5 transition-colors duration-150 active:bg-muted/60",
                            isChecked && "opacity-60",
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggle(item.id)}
                            aria-label={`${item.name}, ${item.quantity}`}
                          />
                          <span
                            className={cn(
                              "flex-1 font-medium transition-all duration-150",
                              isChecked && "line-through decoration-muted-foreground/60",
                            )}
                          >
                            {item.name}
                          </span>
                          <span className="text-sm text-muted-foreground">{item.quantity}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
