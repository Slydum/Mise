"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { parseRecipeText, type ParsedRecipe } from "@/lib/recipe-parser";

interface PasteRecipeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParsed: (parsed: ParsedRecipe) => void;
}

/** Paste raw recipe text; a heuristic parser splits it into ingredients + steps to review and fix. */
export function PasteRecipeSheet({ open, onOpenChange, onParsed }: PasteRecipeSheetProps) {
  const [text, setText] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setText("");
  }

  const handleParse = () => {
    if (!text.trim()) return;
    onParsed(parseRecipeText(text));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Paste a recipe</SheetTitle>
        <SheetDescription>
          Paste ingredients and instructions from anywhere — we&apos;ll do our best to split them
          out, and you can fix anything that&apos;s off.
        </SheetDescription>
        <div className="flex flex-col gap-4 px-6 pb-6 pt-4">
          <Textarea
            autoFocus
            rows={10}
            placeholder={"Ingredients\n2 cups flour\n1 tsp salt\n\nInstructions\n1. Mix everything together\n2. Bake at 350°F for 25 minutes"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Pasted recipe text"
          />
          <Button onClick={handleParse} disabled={!text.trim()}>
            Parse recipe
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
