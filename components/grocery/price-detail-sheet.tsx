"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatApproxPhp } from "@/lib/grocery/currency";
import { formatQuantity } from "@/lib/ingredients";
import { SM_INTEGRATION_UNAVAILABLE_REASON } from "@/lib/sm/adapter";
import type { GroceryItem } from "@/lib/types";

interface PriceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GroceryItem | null;
  storeName?: string;
  onLogPrice: (pricePhp: number) => void;
}

/** Bottom sheet showing the full package breakdown behind a grocery row, its (always-unavailable) live price status, and any purchase history — with a "Log price paid" action. */
export function PriceDetailSheet({ open, onOpenChange, item, storeName, onLogPrice }: PriceDetailSheetProps) {
  const [logging, setLogging] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLogging(false);
      setDraftPrice(item?.lastPaidPricePhp !== undefined ? String(item.lastPaidPricePhp) : "");
    }
  }

  if (!item) return null;

  const lastPaidLabel = item.lastPaidAt
    ? new Date(item.lastPaidAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : undefined;

  const handleSave = () => {
    const parsed = Number(draftPrice.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onLogPrice(parsed);
    setLogging(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{item.name}</SheetTitle>
        <div className="flex flex-col gap-4 px-6 pb-6 pt-4">
          <dl className="flex flex-col divide-y divide-border/60 rounded-2xl border border-border/60">
            <Row
              label="Needed for your plan"
              value={item.usageAmount !== undefined ? formatQuantity(item.usageAmount, item.usageUnit ?? "") : "—"}
            />
            <Row label="Suggested SM package" value={item.packageLabel ?? "No matching package"} />
            {item.packageAmount !== undefined ? (
              <Row label="Package size" value={formatQuantity(item.packageAmount, item.packageUnit ?? "")} />
            ) : null}
            {item.packageCount !== undefined ? <Row label="Packages to buy" value={String(item.packageCount)} /> : null}
            <Row label="Live SM price" value="Unavailable" hint={SM_INTEGRATION_UNAVAILABLE_REASON} />
            {item.lastPaidPricePhp !== undefined ? (
              <Row
                label="Last paid"
                value={`${formatApproxPhp(item.lastPaidPricePhp)}${lastPaidLabel ? ` · ${lastPaidLabel}` : ""}`}
                hint="What you logged after a past shopping trip — not today's price."
              />
            ) : null}
            {storeName ? <Row label="Store" value={storeName} /> : null}
          </dl>

          {logging ? (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="log-price">
                Price paid (₱)
              </label>
              <Input
                id="log-price"
                autoFocus
                inputMode="decimal"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                aria-label="Price paid"
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setLogging(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setLogging(true)} disabled={!storeName}>
              Log price paid
            </Button>
          )}
          {!storeName ? (
            <p className="text-center text-xs text-muted-foreground">Select an SM store in Profile to log a price.</p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-right text-sm font-medium">{value}</dd>
      </div>
      {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
    </div>
  );
}
