"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatApproxPhp } from "@/lib/grocery/currency";
import { formatQuantity } from "@/lib/ingredients";
import type { GroceryItem, PriceSource } from "@/lib/types";

const PRICE_SOURCE_LABELS: Record<PriceSource, string> = {
  "manual-sm": "SM estimate",
  receipt: "From your receipt",
  "sm-online": "SM Online",
};

interface PriceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GroceryItem | null;
  onSavePrice: (pricePhp: number) => void;
}

/** Bottom sheet showing the full price/package breakdown behind a grocery row's estimate, with a manual correction action. */
export function PriceDetailSheet({ open, onOpenChange, item, onSavePrice }: PriceDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [draftPrice, setDraftPrice] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setEditing(false);
      setDraftPrice(item?.estimatedPackagePricePhp !== undefined ? String(item.estimatedPackagePricePhp) : "");
    }
  }

  if (!item) return null;

  const hasPrice = item.estimatedPackagePricePhp !== undefined;
  const updatedLabel = item.priceUpdatedAt
    ? new Date(item.priceUpdatedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : undefined;

  const handleSave = () => {
    const parsed = Number(draftPrice.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onSavePrice(parsed);
    setEditing(false);
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
            <Row
              label="Price per package"
              value={hasPrice ? formatApproxPhp(item.estimatedPackagePricePhp!) : "Price unavailable"}
            />
            <Row
              label="Estimated line total"
              value={item.estimatedTotalPricePhp !== undefined ? formatApproxPhp(item.estimatedTotalPricePhp) : "Price unavailable"}
            />
            {item.priceSource ? <Row label="Source" value={PRICE_SOURCE_LABELS[item.priceSource]} /> : null}
            {item.branch ? <Row label="Branch" value={item.branch} /> : null}
            {updatedLabel ? <Row label="Last updated" value={updatedLabel} /> : null}
          </dl>

          {editing ? (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="edit-price">
                Actual price paid (₱)
              </label>
              <Input
                id="edit-price"
                autoFocus
                inputMode="decimal"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                aria-label="Actual price paid"
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  Save price
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Edit price
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}
