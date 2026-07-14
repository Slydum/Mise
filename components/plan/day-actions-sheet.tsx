"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SheetActionRow } from "@/components/sheet-action-row";

interface DayActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearDay: () => void;
  onRegenerateDay: () => void;
}

/** Clear or reshuffle a whole day's plan — the sheet itself is the confirmation gesture. */
export function DayActionsSheet({ open, onOpenChange, onClearDay, onRegenerateDay }: DayActionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Day options</SheetTitle>
        <SheetDescription>Clear or reshuffle this day&apos;s plan.</SheetDescription>
        <div className="flex flex-col px-2 pb-6 pt-2">
          <SheetActionRow
            icon={RotateCcw}
            label="Regenerate day"
            hint="Fresh picks for every slot"
            onClick={() => {
              onRegenerateDay();
              onOpenChange(false);
            }}
          />
          <SheetActionRow
            icon={Trash2}
            label="Clear day"
            hint="Remove every planned meal"
            destructive
            onClick={() => {
              onClearDay();
              onOpenChange(false);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
