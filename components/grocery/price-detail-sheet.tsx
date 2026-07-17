"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatApproxPhp, formatPhp } from "@/lib/grocery/currency";
import { formatQuantity } from "@/lib/ingredients";
import { geographicLevelLabel, geographicLevelOf } from "@/lib/pricing/geographic";
import { runReceiptOcr, type OcrCandidatePrice } from "@/lib/ocr/receipt-ocr";
import type { PurchaseRecord, PurchaseRecordPricingKind } from "@/lib/grocery/purchase-history";
import type { GroceryItem, ShoppingStore } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LoggedStoreInput {
  storeName: string;
  storeCity: string;
  storeAddress?: string;
}

interface PriceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GroceryItem | null;
  stores: ShoppingStore[];
  currentStoreId: string | null;
  city?: string;
  onLogPrice: (
    pricePhp: number,
    source: PurchaseRecord["source"],
    store: LoggedStoreInput,
    pricingKind: PurchaseRecordPricingKind,
  ) => void;
}

const NEW_STORE = "__new__";

const PRICING_KINDS: { value: PurchaseRecordPricingKind; label: string }[] = [
  { value: "package", label: "Whole purchase" },
  { value: "per-kg", label: "Per kilogram" },
  { value: "per-liter", label: "Per liter" },
];

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
 * results, you decide what to trust), or log a receipt/verified price at
 * whatever store you actually bought/checked it at — any store, not just a
 * single preferred one.
 */
export function PriceDetailSheet({ open, onOpenChange, item, stores, currentStoreId, city, onLogPrice }: PriceDetailSheetProps) {
  const [logging, setLogging] = useState<PurchaseRecord["source"] | null>(null);
  const [pricingKind, setPricingKind] = useState<PurchaseRecordPricingKind>("package");
  const [draftPrice, setDraftPrice] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(currentStoreId ?? stores[0]?.storeId ?? NEW_STORE);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCity, setNewStoreCity] = useState(city ?? "");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [ocrCandidates, setOcrCandidates] = useState<OcrCandidatePrice[] | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const resetScan = () => {
    setScanning(false);
    setScanError(null);
    setOcrCandidates(null);
  };

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLogging(null);
      setPricingKind("package");
      setSelectedStoreId(currentStoreId ?? stores[0]?.storeId ?? NEW_STORE);
      setNewStoreName("");
      setNewStoreCity(city ?? "");
      resetScan();
    }
  }

  if (!item) return null;

  const price = item.priceInfo?.price;
  const geoLabel = price
    ? price.city || price.province || price.region
      ? `${geographicLevelLabel(geographicLevelOf(price))} — ${price.city ?? price.province ?? price.region}`
      : price.storeName
    : undefined;
  const unitPriceLabel = price
    ? price.pricePerKgPhp !== undefined
      ? `${formatPhp(price.pricePerKgPhp)} per kg`
      : price.pricePerLiterPhp !== undefined
        ? `${formatPhp(price.pricePerLiterPhp)} per L`
        : formatPhp(price.pricePhp)
    : undefined;

  const isNewStore = selectedStoreId === NEW_STORE;
  const canSave =
    Number.isFinite(Number(draftPrice.replace(/[^0-9.]/g, ""))) &&
    draftPrice.trim().length > 0 &&
    (isNewStore ? newStoreName.trim().length > 0 && newStoreCity.trim().length > 0 : selectedStoreId !== null);

  const handleSave = () => {
    if (!logging || !canSave) return;
    const parsed = Number(draftPrice.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const store = isNewStore
      ? { storeName: newStoreName.trim(), storeCity: newStoreCity.trim() }
      : (() => {
          const s = stores.find((st) => st.storeId === selectedStoreId)!;
          return { storeName: s.storeName, storeCity: s.storeCity, storeAddress: s.storeAddress };
        })();
    onLogPrice(parsed, logging, store, pricingKind);
    setLogging(null);
    setPricingKind("package");
    setDraftPrice("");
    resetScan();
  };

  const searchQuery = `how much is ${item.name.toLowerCase()}${city ? ` in ${city}` : " in the Philippines"}`;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    setScanError(null);
    setOcrCandidates(null);
    try {
      const result = await runReceiptOcr(file);
      if (result.candidates.length === 0) {
        setScanError("Couldn't find a price on that photo — enter it manually below.");
      } else {
        setOcrCandidates(result.candidates);
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Couldn't read that photo — enter the price manually.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{item.name}</SheetTitle>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 pt-4">
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
              <Row label="Price" value="Price unavailable" hint="No PSA, DTI, or logged price is available for this item yet." />
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
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">Which store?</p>
                <div className="flex flex-wrap gap-1.5">
                  {stores.map((s) => (
                    <button
                      key={s.storeId}
                      type="button"
                      onClick={() => setSelectedStoreId(s.storeId)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selectedStoreId === s.storeId ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground",
                      )}
                    >
                      {s.storeName}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedStoreId(NEW_STORE)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isNewStore ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground",
                    )}
                  >
                    + New store
                  </button>
                </div>
                {isNewStore ? (
                  <div className="mt-1 flex flex-col gap-2">
                    <Input
                      placeholder="Store name, e.g. Puregold Imus"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                      aria-label="Store name"
                    />
                    <Input
                      placeholder="City / area"
                      value={newStoreCity}
                      onChange={(e) => setNewStoreCity(e.target.value)}
                      aria-label="Store city or area"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelected}
                  aria-label="Take a photo of receipt"
                />
                <input
                  ref={libraryInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelected}
                  aria-label="Upload a photo of receipt"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={scanning}
                    className="flex-1"
                  >
                    <Camera className="size-4" aria-hidden />
                    {scanning ? "Reading photo…" : "Take a photo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => libraryInputRef.current?.click()}
                    disabled={scanning}
                    className="flex-1"
                  >
                    <ImageUp className="size-4" aria-hidden />
                    Upload a photo
                  </Button>
                </div>
                {scanError ? <p className="text-xs text-destructive">{scanError}</p> : null}
                {ocrCandidates ? (
                  <div className="flex flex-wrap gap-1.5">
                    {ocrCandidates.map((c, i) => (
                      <button
                        key={`${c.value}-${i}`}
                        type="button"
                        onClick={() => setDraftPrice(String(c.value))}
                        className={cn(
                          "flex max-w-[calc(50%-0.2rem)] flex-col items-start gap-0.5 rounded-xl border px-3 py-1.5 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          draftPrice === String(c.value) ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground",
                        )}
                      >
                        <span className="text-sm font-medium">{formatPhp(c.value)}</span>
                        <span className="w-full truncate text-[11px] text-muted-foreground/80">{c.context}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                {ocrCandidates ? (
                  <p className="text-[11px] text-muted-foreground/70">
                    Read from your photo on this device — tap the right one, or edit it below. Never saved without your confirmation.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">How is it priced?</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICING_KINDS.map((k) => (
                    <button
                      key={k.value}
                      type="button"
                      onClick={() => setPricingKind(k.value)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        pricingKind === k.value ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground",
                      )}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
                {pricingKind !== "package" ? (
                  <p className="text-[11px] text-muted-foreground/70">
                    A rate per {pricingKind === "per-kg" ? "kilogram" : "liter"} — applies no matter how much you buy, like
                    produce weighed at the till. Only prices this item's grocery total when its needed amount is in{" "}
                    {pricingKind === "per-kg" ? "grams/kilograms" : "milliliters/liters"}.
                  </p>
                ) : null}
              </div>

              <label className="text-sm font-medium text-muted-foreground" htmlFor="log-price">
                {pricingKind === "per-kg"
                  ? "Price per kilogram (₱)"
                  : pricingKind === "per-liter"
                    ? "Price per liter (₱)"
                    : logging === "receipt"
                      ? "Price paid (₱)"
                      : "Current price at the store (₱)"}
              </label>
              <Input
                id="log-price"
                autoFocus
                inputMode="decimal"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
                aria-label="Price in pesos"
              />
              {!canSave && draftPrice.trim().length > 0 && isNewStore ? (
                <p className="text-center text-xs text-destructive">
                  Enter the new store's name and city above to save.
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setLogging(null);
                    setPricingKind("package");
                    resetScan();
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={!canSave}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setLogging("receipt")}>
                Log receipt price
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setLogging("user-verified")}>
                Verify current price
              </Button>
            </div>
          )}
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
