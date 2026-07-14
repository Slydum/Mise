"use client";

import { useMemo, useState } from "react";
import { Beef, Carrot, Info, Milk, Package, ShoppingBasket, Snowflake, Wheat } from "lucide-react";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getPriceCatalog, getProfile } from "@/lib/data";
import { useData } from "@/lib/hooks/use-data";
import { useGroceryList } from "@/lib/hooks/use-grocery-list";
import type { GroceryLine } from "@/lib/grocery";
import type { GroceryCategory } from "@/lib/types";
import { DIETARY_STYLE_LABELS, GROCERY_CATEGORY_LABELS, GROCERY_CATEGORY_ORDER } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<GroceryCategory, typeof Carrot> = {
  produce: Carrot,
  protein: Beef,
  dairy: Milk,
  grains: Wheat,
  pantry: Package,
  frozen: Snowflake,
  other: ShoppingBasket,
};

function formatPhp(amount: number): string {
  return `₱${Math.round(amount).toLocaleString()}`;
}

function formatUpdatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}

export function GroceryScreen() {
  const profile = useData(getProfile);
  const priceCatalog = useData(getPriceCatalog);
  const {
    groceryList,
    loading,
    checked,
    toggleChecked,
    clearChecked,
    dietaryStyle,
    weeklyGroceryBudget,
    setPantryOverride,
  } = useGroceryList();
  const [detailsKey, setDetailsKey] = useState<string | null>(null);

  const sections = useMemo(() => {
    if (!groceryList) return null;
    const byCategory = new Map<GroceryCategory, GroceryLine[]>();
    for (const line of groceryList.lines) {
      const list = byCategory.get(line.category) ?? [];
      list.push(line);
      byCategory.set(line.category, list);
    }
    return GROCERY_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      lines: byCategory.get(category)!,
    }));
  }, [groceryList]);

  const total = groceryList?.lines.length ?? 0;
  const doneCount = groceryList?.lines.filter((l) => checked[l.key]).length ?? 0;
  const anyChecked = doneCount > 0;
  const budget = weeklyGroceryBudget ?? profile?.weeklyGroceryBudgetPhp ?? null;
  const budgetRemaining = budget != null && groceryList ? budget - groceryList.basketTotalPhp : null;
  const detailsLine = groceryList?.lines.find((l) => l.key === detailsKey) ?? null;

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader title="Grocery" subtitle={`This week's shop · ${DIETARY_STYLE_LABELS[dietaryStyle]}`}>
        {anyChecked ? (
          <Button variant="ghost" size="sm" onClick={clearChecked} className="text-muted-foreground">
            Clear
          </Button>
        ) : null}
      </ScreenHeader>

      {loading || !sections || !groceryList ? (
        <div className="flex flex-col gap-4 px-5" aria-hidden>
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <>
          <div className="mx-5 flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <p className="font-serif text-lg">
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

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border/60 pt-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Estimated total</dt>
                <dd className="text-lg font-semibold">{formatPhp(groceryList.basketTotalPhp)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Budget remaining</dt>
                <dd
                  className={cn(
                    "text-lg font-semibold",
                    budgetRemaining != null && budgetRemaining < 0 && "text-destructive",
                  )}
                >
                  {budgetRemaining != null ? formatPhp(budgetRemaining) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Cost per serving</dt>
                <dd className="text-sm font-medium">{formatPhp(groceryList.costPerServingPhp)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">Cost per day</dt>
                <dd className="text-sm font-medium">{formatPhp(groceryList.costPerDayPhp)}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-7 px-5">
            {sections.map(({ category, lines }) => {
              const Icon = CATEGORY_ICON[category];
              return (
                <section key={category} aria-label={GROCERY_CATEGORY_LABELS[category]}>
                  <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    <Icon className="size-4" aria-hidden />
                    {GROCERY_CATEGORY_LABELS[category]}
                  </h2>
                  <ul className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
                    {lines.map((line, index) => {
                      const isChecked = Boolean(checked[line.key]);
                      return (
                        <li key={line.key} className={cn(index > 0 && "border-t border-border/60")}>
                          <div
                            className={cn(
                              "flex min-h-14 items-center gap-2 px-4 py-2.5 transition-colors duration-150",
                              isChecked && "opacity-60",
                            )}
                          >
                            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3.5">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleChecked(line.key)}
                                aria-label={`${line.name}, ${line.displayQuantity}`}
                              />
                              <span
                                className={cn(
                                  "min-w-0 flex-1 truncate font-medium transition-all duration-150",
                                  isChecked && "line-through decoration-muted-foreground/60",
                                )}
                              >
                                {line.name}
                              </span>
                              <span className="shrink-0 text-sm text-muted-foreground">
                                {line.displayQuantity}
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setDetailsKey(line.key)}
                              aria-label={`Package details and pantry status for ${line.name}`}
                              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                            >
                              <Info className="size-4.5" aria-hidden />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          {priceCatalog ? (
            <p className="px-6 text-center text-xs text-muted-foreground">
              Prices: {priceCatalog.source} · Updated {formatUpdatedDate(priceCatalog.lastUpdated)}
            </p>
          ) : null}
        </>
      )}

      <Sheet open={Boolean(detailsLine)} onOpenChange={(open) => !open && setDetailsKey(null)}>
        <SheetContent>
          {detailsLine ? (
            <>
              <SheetTitle>{detailsLine.name}</SheetTitle>
              <SheetDescription>Package details and pantry status</SheetDescription>
              <div className="flex flex-col gap-4 p-6 pt-4">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-muted/60 p-4">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Package</dt>
                    <dd className="font-medium">{detailsLine.packageLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Unit price</dt>
                    <dd className="font-medium">{formatPhp(detailsLine.unitPricePhp)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">You need</dt>
                    <dd className="font-medium">{detailsLine.displayQuantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">Line total</dt>
                    <dd className="font-medium">{formatPhp(detailsLine.lineTotalPhp)}</dd>
                  </div>
                </dl>
                {detailsLine.pantryCredited ? (
                  <p className="text-sm text-muted-foreground">
                    Assuming you already have some on hand, so this only covers what's left.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setPantryOverride(detailsLine.key, true);
                    setDetailsKey(null);
                  }}
                  className="flex h-12 items-center justify-center rounded-2xl bg-accent text-sm font-medium text-accent-foreground transition-transform duration-150 active:scale-95"
                >
                  I already have this — remove from list
                </button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
