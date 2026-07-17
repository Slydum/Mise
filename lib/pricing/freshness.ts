import type { CommodityPrice } from "@/lib/pricing/types";

export type FreshnessLevel = "fresh" | "recent" | "stale";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysSince(isoDate: string, now: Date): number {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) return Infinity;
  return (now.getTime() - then) / MS_PER_DAY;
}

/** "2026-06" -> is `now` still within that reporting month (plus a one-month grace period for publication lag)? */
function isReferencePeriodCurrent(referencePeriod: string, now: Date): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(referencePeriod);
  if (!match) return false;
  const periodMonths = Number(match[1]) * 12 + (Number(match[2]) - 1);
  const nowMonths = now.getFullYear() * 12 + now.getMonth();
  return nowMonths - periodMonths <= 1;
}

const USER_VERIFIED_FRESH_DAYS = 7;
const RECEIPT_RECENT_DAYS = 14;

/**
 * Each source has genuinely different freshness semantics — a receipt is
 * "recent" for two weeks, a user's SM verification is "fresh" for a week, a
 * DTI/Price Situationer figure is current through its published period, and
 * PSA OpenSTAT stays the best-available reference until a newer period
 * supersedes it (see lib/pricing/priority.ts, which always prefers the most
 * recent referencePeriod within a tier — that supersession, not a calendar
 * cutoff, is what retires an OpenSTAT figure).
 */
export function classifyPriceFreshness(price: CommodityPrice, now: Date = new Date()): FreshnessLevel {
  switch (price.source) {
    case "user-verified-sm":
      return daysSince(price.verifiedAt ?? price.fetchedAt, now) <= USER_VERIFIED_FRESH_DAYS ? "fresh" : "stale";
    case "receipt":
      return daysSince(price.fetchedAt, now) <= RECEIPT_RECENT_DAYS ? "recent" : "stale";
    case "dti-epresyo":
    case "psa-price-situationer":
      return isReferencePeriodCurrent(price.referencePeriod, now) ? "fresh" : "recent";
    case "psa-openstat":
      return "recent";
  }
}
