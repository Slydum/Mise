"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagEditorProps {
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  placeholder: string;
  emptyHint: string;
  chipVariant?: "default" | "warning";
}

/** Small add/remove chip list for freeform preferences (allergies, exclusions, favorites). */
export function TagEditor({ values, onAdd, onRemove, placeholder, emptyHint, chipVariant = "default" }: TagEditorProps) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    if (draft.trim()) {
      onAdd(draft);
      setDraft("");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 flex-1 rounded-2xl border border-border bg-card px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Add"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90 disabled:opacity-40"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </form>

      {values.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => onRemove(value)}
                aria-label={`Remove ${value}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-transform duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                  chipVariant === "warning"
                    ? "bg-highlight-tint text-highlight-tint-foreground"
                    : "bg-accent text-accent-foreground",
                )}
              >
                {value}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
