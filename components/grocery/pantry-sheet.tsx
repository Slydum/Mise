"use client";

import { Package, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

interface PantrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: string[];
  onRemove: (name: string) => void;
}

/** Manage the pantry — ingredients always on hand, kept off the generated grocery list. */
export function PantrySheet({ open, onOpenChange, items, onRemove }: PantrySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>My Pantry</SheetTitle>
        <SheetDescription>
          Ingredients you always have on hand — kept off your grocery list.
        </SheetDescription>
        {items.length === 0 ? (
          <p className="px-6 pb-6 pt-2 text-sm text-muted-foreground">
            Nothing here yet. Tap the box icon on a grocery item to mark it as something you
            already have.
          </p>
        ) : (
          <ul className="flex flex-col gap-2 overflow-y-auto px-4 pb-6 pt-2">
            {items.map((name) => (
              <li
                key={name}
                className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3"
              >
                <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1 font-medium">{name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(name)}
                  aria-label={`Remove ${name} from pantry`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
