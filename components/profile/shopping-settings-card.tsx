"use client";

import { useState } from "react";
import { Check, LocateFixed, MapPin, Minus, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentPosition } from "@/lib/geolocation";
import { reverseGeocode } from "@/lib/pricing/geocoding";
import { findNearbySmStores, type NearbySmStore } from "@/lib/pricing/sm-locator";
import type { PricingMode, ShoppingSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShoppingSettingsCardProps {
  settings: ShoppingSettings;
  onChange: (patch: Partial<ShoppingSettings>) => void;
  onAddStore: (storeName: string, storeCity: string, storeAddress?: string) => void;
  onSetCurrentStore: (storeId: string) => void;
}

const PRICING_MODES: { value: PricingMode; label: string; hint: string }[] = [
  { value: "normal", label: "Normal estimate", hint: "Typical shelf prices" },
  { value: "conservative", label: "Conservative", hint: "Rounds up for price swings" },
];

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km away` : `${Math.round(meters)} m away`;
}

/**
 * Every store the user shops at, weekly budget, pricing mode, and household
 * size — feeds the Grocery screen's pricing. You can log a price at any
 * store you name (not just SM); the "current" store just decides which
 * store's prices show on the Grocery total by default.
 */
export function ShoppingSettingsCard({ settings, onChange, onAddStore, onSetCurrentStore }: ShoppingSettingsCardProps) {
  const [locRegion, setLocRegion] = useState(settings.region ?? "");
  const [locProvince, setLocProvince] = useState(settings.province ?? "");
  const [locCity, setLocCity] = useState(settings.city ?? "");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [addingStore, setAddingStore] = useState(settings.stores.length === 0);
  const [name, setName] = useState("");
  const [storeCity, setStoreCity] = useState(locCity);
  const [address, setAddress] = useState("");
  const [findingStores, setFindingStores] = useState(false);
  const [storeSearchError, setStoreSearchError] = useState<string | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbySmStore[] | null>(null);

  const canSaveStore = name.trim().length > 0 && storeCity.trim().length > 0;

  const handleSaveStore = () => {
    if (!canSaveStore) return;
    onAddStore(name, storeCity, address);
    setName("");
    setStoreCity(locCity);
    setAddress("");
    setNearbyStores(null);
    setAddingStore(false);
  };

  const handleUseMyLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      const result = await reverseGeocode(coords);
      if (!result) {
        setLocationError("Couldn't determine your area from that location — enter it manually.");
        return;
      }
      if (result.region) setLocRegion(result.region);
      if (result.province) setLocProvince(result.province);
      if (result.city) setLocCity(result.city);
      onChange({
        region: result.region ?? settings.region,
        province: result.province ?? settings.province,
        city: result.city ?? settings.city,
      });
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : "Couldn't get your location.");
    } finally {
      setLocating(false);
    }
  };

  const handleFindNearbyStores = async () => {
    setFindingStores(true);
    setStoreSearchError(null);
    setNearbyStores(null);
    try {
      const coords = await getCurrentPosition();
      const results = await findNearbySmStores(coords);
      if (results.length === 0) {
        setStoreSearchError("No SM branches found nearby in OpenStreetMap — enter yours manually below.");
        return;
      }
      setNearbyStores(results);
    } catch (err) {
      setStoreSearchError(err instanceof Error ? err.message : "Couldn't search for nearby stores.");
    } finally {
      setFindingStores(false);
    }
  };

  const handlePickNearbyStore = (store: NearbySmStore) => {
    setName(store.name);
    setStoreCity(locCity || storeCity);
    setAddress(store.address ?? "");
    setNearbyStores(null);
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseMyLocation}
            disabled={locating}
            className="w-fit"
          >
            <LocateFixed className="size-4" aria-hidden />
            {locating ? "Finding your area…" : "Use my location"}
          </Button>
          {locationError ? <p className="text-xs text-destructive">{locationError}</p> : null}
          <Input
            placeholder="Region, e.g. Region IV-A (CALABARZON)"
            value={locRegion}
            onChange={(e) => setLocRegion(e.target.value)}
            onBlur={(e) => onChange({ region: e.target.value.trim() || undefined })}
            aria-label="Region"
          />
          <Input
            placeholder="Province, e.g. Cavite"
            value={locProvince}
            onChange={(e) => setLocProvince(e.target.value)}
            onBlur={(e) => onChange({ province: e.target.value.trim() || undefined })}
            aria-label="Province"
          />
          <Input
            placeholder="City or municipality, e.g. Imus"
            value={locCity}
            onChange={(e) => setLocCity(e.target.value)}
            onBlur={(e) => onChange({ city: e.target.value.trim() || undefined })}
            aria-label="City or municipality"
          />
          <p className="text-[11px] text-muted-foreground/70">Location lookup powered by OpenStreetMap.</p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-muted-foreground">Your stores</p>
        {settings.stores.length === 0 && !addingStore ? null : (
          <p className="mb-2 text-xs text-muted-foreground">
            Add every store you actually shop at — any supermarket, not just SM. Prices you log stay scoped to the
            exact store you name; tap a store below to make it the one shown on your grocery total.
          </p>
        )}

        {settings.stores.length > 0 ? (
          <ul className="mb-3 flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl border border-border">
            {settings.stores.map((store) => {
              const isCurrent = store.storeId === settings.currentStoreId;
              return (
                <li key={store.storeId}>
                  <button
                    type="button"
                    onClick={() => onSetCurrentStore(store.storeId)}
                    aria-pressed={isCurrent}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted",
                      isCurrent && "bg-accent/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                        isCurrent ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isCurrent ? <Check className="size-4.5" aria-hidden /> : <MapPin className="size-4.5" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{store.storeName}</span>
                      <span className="block truncate text-sm text-muted-foreground">
                        {store.storeCity}
                        {store.storeAddress ? ` · ${store.storeAddress}` : ""}
                      </span>
                    </span>
                    {isCurrent ? <span className="shrink-0 text-xs font-medium text-accent-foreground">Shopping here</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {addingStore ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFindNearbyStores}
              disabled={findingStores}
              className="w-fit"
            >
              <Search className="size-4" aria-hidden />
              {findingStores ? "Searching nearby…" : "Find nearby SM stores"}
            </Button>
            {storeSearchError ? <p className="text-xs text-destructive">{storeSearchError}</p> : null}

            {nearbyStores ? (
              <ul className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60">
                {nearbyStores.map((store) => (
                  <li key={`${store.name}-${store.lat}-${store.lon}`}>
                    <button
                      type="button"
                      onClick={() => handlePickNearbyStore(store)}
                      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{store.name}</span>
                        {store.address ? (
                          <span className="block truncate text-xs text-muted-foreground">{store.address}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDistance(store.distanceMeters)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-[11px] text-muted-foreground/70">
              Store search powered by OpenStreetMap community data, and only finds SM branches — coverage isn't
              guaranteed complete. Shopping somewhere else? Just type it in below.
            </p>

            <Input
              placeholder="Store name, e.g. Puregold Imus or SM Supermarket Fairview"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Store name"
            />
            <Input
              placeholder="City / area, e.g. Quezon City"
              value={storeCity}
              onChange={(e) => setStoreCity(e.target.value)}
              aria-label="Store city or area"
            />
            <Input
              placeholder="Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-label="Store address"
            />
            <div className="flex gap-2">
              {settings.stores.length > 0 ? (
                <Button variant="ghost" className="flex-1" onClick={() => setAddingStore(false)}>
                  Cancel
                </Button>
              ) : null}
              <Button className="flex-1" onClick={handleSaveStore} disabled={!canSaveStore}>
                Save store
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setAddingStore(true)} className="w-fit">
            <Plus className="size-4" aria-hidden />
            Add a store
          </Button>
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
