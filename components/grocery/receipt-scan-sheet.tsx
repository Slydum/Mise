"use client";

import { useRef, useState } from "react";
import { Camera, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatPhp } from "@/lib/grocery/currency";
import { runReceiptOcr, type OcrCandidatePrice } from "@/lib/ocr/receipt-ocr";
import type { LoggedPriceAssignment } from "@/lib/hooks/use-grocery-list";
import type { PurchaseRecord, PurchaseRecordPricingKind } from "@/lib/grocery/purchase-history";
import type { GroceryItem, ShoppingStore } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LoggedStoreInput {
  storeName: string;
  storeCity: string;
  storeAddress?: string;
}

interface ReceiptScanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The current grocery list to assign detected prices against. */
  items: GroceryItem[];
  stores: ShoppingStore[];
  currentStoreId: string | null;
  onSave: (assignments: LoggedPriceAssignment[], source: PurchaseRecord["source"], store: LoggedStoreInput) => void;
}

const NEW_STORE = "__new__";
const PRICING_KIND_LABELS: Record<PurchaseRecordPricingKind, string> = {
  package: "Whole purchase",
  "per-kg": "Per kg",
  "per-liter": "Per liter",
};

interface RowAssignment {
  itemId: string;
  pricingKind: PurchaseRecordPricingKind;
}

/**
 * Scan one receipt photo and log prices for several grocery items at once,
 * instead of re-opening each item's own sheet and re-uploading the same
 * photo. OCR still only ever surfaces candidates — every assignment here is
 * a deliberate tap, and nothing is saved until "Save" is pressed.
 */
export function ReceiptScanSheet({ open, onOpenChange, items, stores, currentStoreId, onSave }: ReceiptScanSheetProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(currentStoreId ?? stores[0]?.storeId ?? NEW_STORE);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCity, setNewStoreCity] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<OcrCandidatePrice[] | null>(null);
  const [assignments, setAssignments] = useState<Record<number, RowAssignment>>({});
  const [pickerForIndex, setPickerForIndex] = useState<number | null>(null);
  const [itemFilter, setItemFilter] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelectedStoreId(currentStoreId ?? stores[0]?.storeId ?? NEW_STORE);
      setNewStoreName("");
      setNewStoreCity("");
      setScanning(false);
      setScanError(null);
      setCandidates(null);
      setAssignments({});
      setPickerForIndex(null);
      setItemFilter("");
    }
  }

  const isNewStore = selectedStoreId === NEW_STORE;
  const assignedCount = Object.keys(assignments).length;
  const canSave =
    assignedCount > 0 &&
    (isNewStore ? newStoreName.trim().length > 0 && newStoreCity.trim().length > 0 : selectedStoreId !== null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    setScanError(null);
    setCandidates(null);
    setAssignments({});
    try {
      const result = await runReceiptOcr(file);
      if (result.candidates.length === 0) {
        setScanError("Couldn't find any prices on that photo.");
      } else {
        setCandidates(result.candidates);
      }
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Couldn't read that photo.");
    } finally {
      setScanning(false);
    }
  };

  const handleAssign = (index: number, item: GroceryItem) => {
    setAssignments((prev) => ({ ...prev, [index]: { itemId: item.id, pricingKind: "package" } }));
    setPickerForIndex(null);
    setItemFilter("");
  };

  const handleUnassign = (index: number) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const setRowPricingKind = (index: number, pricingKind: PurchaseRecordPricingKind) => {
    setAssignments((prev) => (prev[index] ? { ...prev, [index]: { ...prev[index], pricingKind } } : prev));
  };

  const handleSave = () => {
    if (!candidates || !canSave) return;
    const store = isNewStore
      ? { storeName: newStoreName.trim(), storeCity: newStoreCity.trim() }
      : (() => {
          const s = stores.find((st) => st.storeId === selectedStoreId)!;
          return { storeName: s.storeName, storeCity: s.storeCity, storeAddress: s.storeAddress };
        })();
    const result: LoggedPriceAssignment[] = Object.entries(assignments)
      .map(([indexStr, a]) => {
        const candidate = candidates[Number(indexStr)];
        const item = items.find((it) => it.id === a.itemId);
        if (!item) return null;
        return { item, pricePhp: candidate.value, pricingKind: a.pricingKind };
      })
      .filter((a): a is LoggedPriceAssignment => a !== null);
    if (result.length === 0) return;
    onSave(result, "receipt", store);
    onOpenChange(false);
  };

  const filteredItems = itemFilter.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(itemFilter.trim().toLowerCase()))
    : items;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Scan a receipt</SheetTitle>
        <div className="flex flex-col gap-4 overflow-y-auto px-6 pb-6 pt-4">
          <p className="text-sm text-muted-foreground">
            Scan once, then assign each price to the grocery item it's for. Nothing is saved until you tap Save below.
          </p>

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
          </div>

          {candidates ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                {assignedCount} of {candidates.length} prices assigned
              </p>
              <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60">
                {candidates.map((c, i) => {
                  const assignment = assignments[i];
                  const assignedItem = assignment ? items.find((it) => it.id === assignment.itemId) : undefined;
                  return (
                    <li key={i} className="flex flex-col gap-2 px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{formatPhp(c.value)}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.context}</p>
                        </div>
                        {assignedItem ? (
                          <Button variant="ghost" size="sm" onClick={() => handleUnassign(i)}>
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setPickerForIndex(pickerForIndex === i ? null : i);
                              setItemFilter("");
                            }}
                          >
                            Assign
                          </Button>
                        )}
                      </div>

                      {assignedItem ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-accent/40 px-2.5 py-1 text-xs font-medium">{assignedItem.name}</span>
                          {(Object.keys(PRICING_KIND_LABELS) as PurchaseRecordPricingKind[]).map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => setRowPricingKind(i, k)}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                assignment!.pricingKind === k ? "border-primary bg-primary/10" : "border-border/60 text-muted-foreground",
                              )}
                            >
                              {PRICING_KIND_LABELS[k]}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {pickerForIndex === i ? (
                        <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 p-2">
                          <Input
                            placeholder="Search your grocery list…"
                            value={itemFilter}
                            onChange={(e) => setItemFilter(e.target.value)}
                            aria-label="Search grocery items"
                          />
                          <ul className="flex max-h-40 flex-col overflow-y-auto">
                            {filteredItems.length === 0 ? (
                              <li className="px-2 py-2 text-xs text-muted-foreground">No matching items.</li>
                            ) : (
                              filteredItems.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleAssign(i, item)}
                                    className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                                  >
                                    {item.name}
                                  </button>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {!canSave ? (
            <p className="text-center text-xs text-destructive">
              {assignedCount === 0
                ? "Assign at least one price above to save."
                : "Enter the new store's name and city above (in the \"Which store?\" section) to save."}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={!canSave}>
              Save {assignedCount > 0 ? `${assignedCount} price${assignedCount === 1 ? "" : "s"}` : "prices"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
