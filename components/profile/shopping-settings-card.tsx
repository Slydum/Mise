"use client";

import { Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PricingMode, ShoppingSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShoppingSettingsCardProps {
  settings: ShoppingSettings;
  onChange: (patch: Partial<ShoppingSettings>) => void;
}

const PRICING_MODES: { value: PricingMode; label: string; hint: string }[] = [
  { value: "normal", label: "Normal estimate", hint: "Typical SM shelf prices" },
  { value: "conservative", label: "Conservative", hint: "Rounds up for price swings" },
];

/** Preferred supermarket/branch, weekly budget, pricing mode, and household size — feeds the Grocery screen's SM price estimate. */
export function ShoppingSettingsCard({ settings, onChange }: ShoppingSettingsCardProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">Preferred supermarket</p>
        <Input value={settings.preferredSupermarket} disabled aria-label="Preferred supermarket" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted-foreground" htmlFor="sm-branch">
          Preferred branch or area
        </label>
        <Input
          id="sm-branch"
          placeholder="e.g. SM Fairview"
          defaultValue={settings.preferredBranch}
          onBlur={(e) => onChange({ preferredBranch: e.target.value.trim() })}
          aria-label="Preferred SM branch or area"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted-foreground" htmlFor="weekly-budget">
          Weekly grocery budget
        </label>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            ₱
          </span>
          <Input
            id="weekly-budget"
            className="pl-8"
            inputMode="numeric"
            defaultValue={String(settings.weeklyBudgetPhp)}
            onBlur={(e) => {
              const parsed = Number(e.target.value.replace(/[^0-9.]/g, ""));
              onChange({ weeklyBudgetPhp: Number.isFinite(parsed) && parsed >= 0 ? parsed : settings.weeklyBudgetPhp });
            }}
            aria-label="Weekly grocery budget in pesos"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">Pricing mode</p>
        <div className="flex gap-2">
          {PRICING_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              role="radio"
              aria-checked={settings.pricingMode === mode.value}
              onClick={() => onChange({ pricingMode: mode.value })}
              className={cn(
                "flex-1 rounded-2xl border px-3.5 py-2.5 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                settings.pricingMode === mode.value ? "border-primary bg-primary/10" : "border-border/60",
              )}
            >
              <span className="block text-sm font-medium">{mode.label}</span>
              <span className="block text-xs text-muted-foreground">{mode.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">Household size</p>
        <span className="flex w-fit items-center gap-0.5 rounded-full bg-muted p-0.5">
          <button
            type="button"
            onClick={() => onChange({ householdSize: Math.max(1, settings.householdSize - 1) })}
            disabled={settings.householdSize <= 1}
            aria-label="Fewer people"
            className="flex size-9 items-center justify-center rounded-full text-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-card disabled:opacity-30"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-24 text-center text-sm font-medium" aria-live="polite">
            {settings.householdSize} {settings.householdSize === 1 ? "person" : "people"}
          </span>
          <button
            type="button"
            onClick={() => onChange({ householdSize: Math.min(12, settings.householdSize + 1) })}
            disabled={settings.householdSize >= 12}
            aria-label="More people"
            className="flex size-9 items-center justify-center rounded-full text-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-card disabled:opacity-30"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </span>
      </div>
    </div>
  );
}
