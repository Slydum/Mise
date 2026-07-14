"use client";

import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Share2 } from "lucide-react";
import { AddGroceryItemSheet } from "@/components/grocery/add-grocery-item-sheet";
import { PantrySheet } from "@/components/grocery/pantry-sheet";
import { PriceDetailSheet } from "@/components/grocery/price-detail-sheet";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useGroceryList } from "@/lib/hooks/use-grocery-list";
import { useShoppingSettings } from "@/lib/hooks/use-shopping-settings";
import { useToast } from "@/lib/hooks/use-toast";
import { isPricingFresh, summarizeBasket } from "@/lib/grocery/basket";
import { formatApproxPhp, formatPhp } from "@/lib/grocery/currency";
import { formatQuantity } from "@/lib/ingredients";
import type { GroceryCategory, GroceryItem } from "@/lib/types";
import { DIETARY_STYLE_LABELS, GROCERY_CATEGORY_LABELS, GROCERY_CATEGORY_ORDER } from "@/lib/types";
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

const MANUAL_ID_PREFIX = "extra-manual-";

export function GroceryScreen() {
  const { dietaryStyle } = useDietaryStyle();
  const { settings: shoppingSettings } = useShoppingSettings();
  const grocery = useGroceryList(dietaryStyle, shoppingSettings.householdSize);
  const { message: toastMessage, showToast } = useToast();

  const [hideCompleted, setHideCompleted] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null);
  const [pantryOpen, setPantryOpen] = useState(false);
  const [priceDetailItem, setPriceDetailItem] = useState<GroceryItem | null>(null);

  const sections = useMemo(() => {
    const byCategory = new Map<GroceryCategory, GroceryItem[]>();
    for (const item of grocery.items) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return GROCERY_CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((category) => ({
      category,
      items: byCategory.get(category)!,
    }));
  }, [grocery.items]);

  const total = grocery.items.length;
  const doneCount = grocery.items.filter((i) => grocery.checked[i.id]).length;
  const anyChecked = doneCount > 0;

  const basket = useMemo(
    () => summarizeBasket(grocery.items, shoppingSettings.weeklyBudgetPhp),
    [grocery.items, shoppingSettings.weeklyBudgetPhp],
  );
  const pricingFresh = isPricingFresh(basket.mostRecentPriceUpdatedAt);

  const budgetStatus =
    shoppingSettings.weeklyBudgetPhp > 0
      ? basket.budgetDeltaPhp >= 0
        ? `${formatPhp(basket.budgetDeltaPhp)} under your ${formatPhp(basket.budgetPhp)} weekly budget`
        : `${formatPhp(Math.abs(basket.budgetDeltaPhp))} over your ${formatPhp(basket.budgetPhp)} weekly budget`
      : null;

  const priceStatus =
    basket.unpricedCount > 0
      ? `${basket.unpricedCount} item${basket.unpricedCount === 1 ? "" : "s"} need${basket.unpricedCount === 1 ? "s" : ""} a price`
      : pricingFresh
        ? "Prices updated recently"
        : "Prices may be outdated";

  const handleShare = async () => {
    const remaining = grocery.items.filter((i) => !grocery.checked[i.id]);
    if (remaining.length === 0) {
      showToast("Nothing left to share");
      return;
    }
    const byCategory = new Map<GroceryCategory, GroceryItem[]>();
    for (const item of remaining) {
      byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]);
    }
    const text = GROCERY_CATEGORY_ORDER.filter((c) => byCategory.has(c))
      .map(
        (c) =>
          `${GROCERY_CATEGORY_LABELS[c]}\n${byCategory
            .get(c)!
            .map((i) => `- ${formatQuantity(i.amount, i.unit)} ${i.name}`)
            .join("\n")}`,
      )
      .join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Grocery list", text });
      } catch {
        // User cancelled the share sheet — not an error.
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard");
    }
  };

  const handleAddToPantry = (item: GroceryItem) => {
    grocery.addToPantry(item.name);
    showToast(`${item.name} added to pantry`);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <ScreenHeader title="Grocery" subtitle={`Next 7 days · ${DIETARY_STYLE_LABELS[dietaryStyle]}`}>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setPantryOpen(true)} aria-label="My Pantry">
            <Package className="size-5" aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleShare} aria-label="Share list">
            <Share2 className="size-5" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingItem(null);
              setAddItemOpen(true);
            }}
            aria-label="Add item"
          >
            <Plus className="size-5" aria-hidden />
          </Button>
        </div>
      </ScreenHeader>

      {grocery.loading ? (
        <div className="flex flex-col gap-4 px-5" aria-hidden>
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      ) : (
        <>
          <div className="mx-5 flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-6 shadow-soft">
            {total > 0 ? (
              <div className="flex flex-col gap-1 border-b border-border/60 pb-4">
                <p className="text-sm font-medium text-muted-foreground">Estimated SM total</p>
                <p className="font-serif text-3xl tracking-tight">{formatApproxPhp(basket.totalPhp)}</p>
                {budgetStatus ? <p className="text-sm text-muted-foreground">{budgetStatus}</p> : null}
                <p className="text-xs text-muted-foreground">{priceStatus}</p>
              </div>
            ) : null}

            <div className="flex items-baseline justify-between">
              <p className="font-serif text-lg">
                {doneCount} of {total} items
              </p>
              <p className="text-sm text-muted-foreground">
                {total === 0
                  ? "0%"
                  : doneCount === total
                    ? "All done 🎉"
                    : `${Math.round((doneCount / total) * 100)}% complete`}
              </p>
            </div>
            <Progress
              value={total === 0 ? 0 : (doneCount / total) * 100}
              aria-label={`${doneCount} of ${total} grocery items checked`}
            />
            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-muted-foreground">
                <Checkbox
                  checked={hideCompleted}
                  onCheckedChange={() => setHideCompleted((v) => !v)}
                  aria-label="Hide completed items"
                  className="size-4.5"
                />
                Hide completed
              </label>
              {anyChecked ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={grocery.clearChecked}
                  className="text-muted-foreground"
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>

          {total === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <span className="text-4xl" aria-hidden>
                🧺
              </span>
              <p className="font-serif text-lg">Nothing to grab</p>
              <p className="text-sm text-muted-foreground">
                Plan a few meals or add an item to get started.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-7 px-5">
              {sections.map(({ category, items: sectionItems }) => {
                const visibleItems = hideCompleted
                  ? sectionItems.filter((i) => !grocery.checked[i.id])
                  : sectionItems;
                if (visibleItems.length === 0) return null;
                return (
                  <section key={category} aria-label={GROCERY_CATEGORY_LABELS[category]}>
                    <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      <span aria-hidden>{CATEGORY_EMOJI[category]}</span>
                      {GROCERY_CATEGORY_LABELS[category]}
                    </h2>
                    <ul className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
                      {visibleItems.map((item, index) => {
                        const isChecked = Boolean(grocery.checked[item.id]);
                        const quantity = formatQuantity(item.amount, item.unit);
                        const isManual = item.id.startsWith(MANUAL_ID_PREFIX);
                        const priceLabel =
                          item.estimatedTotalPricePhp !== undefined
                            ? formatApproxPhp(item.estimatedTotalPricePhp)
                            : undefined;
                        return (
                          <li key={item.id} className={cn(index > 0 && "border-t border-border/60")}>
                            <div
                              className={cn(
                                "flex min-h-14 items-center gap-1.5 px-4 py-2.5 transition-colors duration-150",
                                isChecked && "opacity-60",
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => grocery.toggleChecked(item.id)}
                                aria-label={`${item.name}, ${quantity}`}
                              />
                              <button
                                type="button"
                                onClick={() => setPriceDetailItem(item)}
                                className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label={`View price details for ${item.name}`}
                              >
                                <span
                                  className={cn(
                                    "min-w-0 flex-1 truncate font-medium transition-all duration-150",
                                    isChecked && "line-through decoration-muted-foreground/60",
                                  )}
                                >
                                  {item.name}
                                </span>
                              </button>
                              <div className="flex shrink-0 flex-col items-end">
                                <span className="text-sm text-muted-foreground">{quantity}</span>
                                {priceLabel ? (
                                  <span className="text-xs text-muted-foreground/80">{priceLabel}</span>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddToPantry(item)}
                                aria-label={`Mark ${item.name} as already have`}
                                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                              >
                                <Package className="size-4" aria-hidden />
                              </button>
                              {isManual ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setAddItemOpen(true);
                                  }}
                                  aria-label={`Edit ${item.name}`}
                                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                                >
                                  <Pencil className="size-4" aria-hidden />
                                </button>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}

      <AddGroceryItemSheet
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        editingItem={editingItem}
        onSubmit={(values) => {
          if (editingItem) {
            grocery.updateItem(editingItem.id, values);
            showToast("Updated");
          } else {
            grocery.addItem(values);
            showToast("Added to list");
          }
        }}
        onDelete={
          editingItem
            ? () => {
                grocery.removeItem(editingItem.id);
                showToast("Removed");
              }
            : undefined
        }
      />

      <PantrySheet
        open={pantryOpen}
        onOpenChange={setPantryOpen}
        items={grocery.pantryItems}
        onRemove={(name) => {
          grocery.removeFromPantry(name);
          showToast(`${name} removed from pantry`);
        }}
      />

      <PriceDetailSheet
        open={priceDetailItem !== null}
        onOpenChange={(open) => {
          if (!open) setPriceDetailItem(null);
        }}
        item={priceDetailItem}
        onSavePrice={(pricePhp) => {
          if (priceDetailItem) {
            grocery.updatePrice(priceDetailItem, pricePhp);
            showToast("Price updated");
          }
        }}
      />

      <Toast message={toastMessage} />
    </div>
  );
}
