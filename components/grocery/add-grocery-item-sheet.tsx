"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { GroceryCategory, GroceryItem } from "@/lib/types";
import { GROCERY_CATEGORY_LABELS, GROCERY_CATEGORY_ORDER } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddGroceryItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing manually-added item rather than creating one. */
  editingItem?: GroceryItem | null;
  onSubmit: (values: { name: string; amount: number; unit: string; category: GroceryCategory }) => void;
  onDelete?: () => void;
}

/** Add or edit a manually-entered grocery item — name, amount, unit, aisle category. */
export function AddGroceryItemSheet({
  open,
  onOpenChange,
  editingItem,
  onSubmit,
  onDelete,
}: AddGroceryItemSheetProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState<GroceryCategory>("other");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(editingItem?.name ?? "");
      setAmount(editingItem ? String(editingItem.amount) : "1");
      setUnit(editingItem?.unit ?? "");
      setCategory(editingItem?.category ?? "other");
    }
  }

  const canSave = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSave) return;
    onSubmit({ name: name.trim(), amount: Number(amount) || 1, unit: unit.trim(), category });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{editingItem ? "Edit item" : "Add item"}</SheetTitle>
        <div className="flex flex-col gap-4 px-6 pb-6 pt-4">
          <Input
            autoFocus
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Item name"
          />
          <div className="flex gap-2">
            <Input
              className="w-20 px-2 text-center"
              inputMode="decimal"
              placeholder="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="Amount"
            />
            <Input
              className="flex-1"
              placeholder="unit (optional)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              aria-label="Unit"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {GROCERY_CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {GROCERY_CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
          <Button onClick={handleSubmit} disabled={!canSave}>
            {editingItem ? "Save changes" : "Add to list"}
          </Button>
          {editingItem && onDelete ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
            >
              Remove item
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
