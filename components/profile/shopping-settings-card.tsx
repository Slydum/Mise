"use client";

import { useState } from "react";
import { MapPin, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PricingMode, ShoppingSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShoppingSettingsCardProps {
  settings: ShoppingSettings;
  onChange: (patch: Partial<ShoppingSettings>) => void;
  onSetStore: (storeName: string, storeCity: string, storeAddress?: string) => void;
}

const PRICING_MODES: { value: PricingMode; label: string; hint: string }[] = [
  { value: "normal", label: "Normal estimate", hint: "Typical SM shelf prices" },
  { value: "conservative", label: "Conservative", hint: "Rounds up for price swings" },
];

/** Exact SM store, weekly budget, pricing mode, and household size — feeds the Grocery screen's pricing. Store is required before any pricing is shown; "SM Markets" alone is never treated as a price location. */
export function ShoppingSettingsCard({ settings, onChange, onSetStore }: ShoppingSettingsCardProps) {
  const [editingStore, setEditingStore] = useState(!settings.store);
  const [name, setName] = useState(settings.store?.storeName ?? "");
  const [city, setCity] = useState(settings.store?.storeCity ?? "");
  const [address, setAddress] = useState(settings.store?.storeAddress ?? "");

  const canSaveStore = name.trim().length > 0 && city.trim().length > 0;

  const handleSaveStore = () => {
    if (!canSaveStore) return;
    onSetStore(name, city, address);
    setEditingStore(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">Location (Philippines)</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Used to request PSA/DTI reference prices for your area — most specific wins (city, then province, then
          region).
        </p>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Region, e.g. Region IV-A (CALABARZON)"
            defaultValue={settings.region ?? ""}
            onBlur={(e) => onChange({ region: e.target.value.trim() || undefined })}
            aria-label="Region"
          />
          <Input
            placeholder="Province, e.g. Cavite"
            defaultValue={settings.province ?? ""}
            onBlur={(e) => onChange({ province: e.target.value.trim() || undefined })}
            aria-label="Province"
          />
          <Input
            placeholder="City or municipality, e.g. Imus"
            defaultValue={settings.city ?? ""}
            onBlur={(e) => onChange({ city: e.target.value.trim() || undefined })}
            aria-label="City or municipality"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">SM store</p>
        {!editingStore && settings.store ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <MapPin className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{settings.store.storeName}</p>
              <p className="truncate text-sm text-muted-foreground">
                {settings.store.storeCity}
                {settings.store.storeAddress ? ` · ${settings.store.storeAddress}` : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditingStore(true)}>
              Change
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            {!settings.store ? (
              <p className="text-sm text-muted-foreground">
                Pricing needs your exact branch — "SM Markets" alone isn't specific enough. Enter the store you
                actually shop at.
              </p>
            ) : null}
            <Input
              placeholder="Store name, e.g. SM Supermarket Fairview"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="SM store name"
            />
            <Input
              placeholder="City / area, e.g. Quezon City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="SM store city or area"
            />
            <Input
              placeholder="Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-label="SM store address"
            />
            <div className="flex gap-2">
              {settings.store ? (
                <Button variant="ghost" className="flex-1" onClick={() => setEditingStore(false)}>
                  Cancel
                </Button>
              ) : null}
              <Button className="flex-1" onClick={handleSaveStore} disabled={!canSaveStore}>
                Save store
              </Button>
            </div>
          </div>
        )}
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
