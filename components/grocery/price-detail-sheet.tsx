"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatApproxPhp, formatPhp } from "@/lib/grocery/currency";
import { formatQuantity } from "@/lib/ingredients";
import { geographicLevelLabel, geographicLevelOf } from "@/lib/pricing/geographic";
import type { PurchaseRecord } from "@/lib/grocery/purchase-history";
import type { GroceryItem } from "@/lib/types";

interface PriceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GroceryItem | null;
  storeName?: string;
  city?: string;
  onLogPrice: (pricePhp: number, source: PurchaseRecord["source"]) => void;
}

function formatReferencePeriod(period: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period);
  if (!match) return period;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function searchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Bottom sheet showing the full breakdown behind a grocery row's price (or
 * why one isn't available), and two ways to add real local data: search the
 * web yourself (opens in a new tab — Mise never reads or interprets the
 * results, you decide what to trust), or log a receipt/verified SM price.
 */
export function PriceDetailSheet({ open, onOpenChange, item, storeName, city, onLogPrice }: PriceDetailSheetProps) {
  const [logging, setLogging] = useState<PurchaseRecord["source"] | null>(null);
  const [draftPrice, setDraftPrice] = useState("");

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setLogging(null);
  }

  if (!item) return null;

  const price = item.priceInfo?.price;
  const geoLabel = price
    ? price.city || price.province || price.region
      ? `${geographicLevelLabel(geographicLevelOf(price))} — ${price.city ?? price.province ?? price.region}`
      : price.storeName ?? storeName
    : undefined;
  const unitPriceLabel = price
    ? price.pricePerKgPhp !== undefined
      ? `${formatPhp(price.pricePerKgPhp)} per kg`
      : price.pricePerLiterPhp !== undefined
        ? `${formatPhp(price.pricePerLiterPhp)} per L`
        : formatPhp(price.pricePhp)
    : undefined;

  const handleSave = () => {
    if (!logging) return;
    const parsed = Number(draftPrice.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    onLogPrice(parsed, logging);
    setLogging(null);
    setDraftPrice("");
  };

  const searchQuery = `how much is ${item.name.toLowerCase()}${city ? ` in ${city}` : " in the Philippines"}`;

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
            <Row label="Suggested package" value={item.packageLabel ?? "No matching package"} />
            {item.packageAmount !== undefined ? (
              <Row label="Package size" value={formatQuantity(item.packageAmount, item.packageUnit ?? "")} />
            ) : null}
            {item.packageCount !== undefined ? <Row label="Packages to buy" value={String(item.packageCount)} /> : null}

            {price ? (
              <>
                <Row label="Commodity / product" value={price.commodityName} />
                <Row label="Unit price" value={unitPriceLabel ?? "—"} />
                <Row
                  label={item.priceInfo!.isUsageReference ? "Estimated cost" : "Line total"}
                  value={`${item.priceInfo!.isUsageReference ? "≈ " : ""}${formatPhp(item.priceInfo!.lineTotalPhp)}`}
                  hint={
                    item.priceInfo!.isUsageReference
                      ? "A market-reference estimate, not a guaranteed checkout price."
                      : undefined
                  }
                />
                {geoLabel ? <Row label="Coverage" value={geoLabel} /> : null}
                <Row label="Source" value={price.sourceLabel} />
                <Row label="Reference period" value={formatReferencePeriod(price.referencePeriod)} />
                <Row label={price.verifiedAt ? "Verified" : "Fetched"} value={formatDate(price.verifiedAt ?? price.fetchedAt)} />
                {price.sourceUrl ? (
                  <div className="px-4 py-3">
                    <a
                      href={price.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary underline underline-offset-2"
                    >
                      Open source
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <Row label="Price" value="Price unavailable" hint="No PSA, DTI, or verified SM price is available for this item yet." />
            )}
          </dl>

          <a
            href={searchUrl(searchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-2.5 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              Search prices online
              <span className="block text-xs font-normal text-muted-foreground">
                Opens in a new tab — unverified, read it yourself before logging a price below.
              </span>
            </span>
          </a>

          {logging ? (
            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium text-muted-foreground" htmlFor="log-price">
                {logging === "receipt" ? "Price paid (₱)" : "Current price at SM (₱)"}
              </label>
              <Input
                id="log-price"
                autoFocus
                inputMode="decimal"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                aria-label="Price in pesos"
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setLogging(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setLogging("receipt")} disabled={!storeName}>
                Log receipt price
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setLogging("user-verified-sm")} disabled={!storeName}>
                Verify at SM
              </Button>
            </div>
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
