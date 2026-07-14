import type { LivePriceStatus } from "@/lib/types";
import type { SmAdapterResult, SmLiveProduct } from "@/lib/sm/types";

/**
 * The seam for a real SM Markets Online integration. There isn't one today:
 *
 * - SM Markets Online (shop.smmarkets.ph) publishes no public product/price
 *   API or developer program.
 * - This deployment (Next.js static export on GitHub Pages) has no server
 *   runtime to host a price-fetching endpoint even if a data source
 *   existed — see README.md's "Live SM pricing" section for what moving to
 *   a real host (e.g. Vercel) plus a real data source would take.
 *
 * Every function here is an honest stub: it never fetches, never invents a
 * plausible-looking price, and always returns "integration-unavailable"
 * with a reason a caller can surface directly to the user. Swapping in a
 * real implementation later — an official API, a partner feed, or a
 * properly-authorized adapter someone builds after directly inspecting
 * SM's storefront in a real browser — should only require changing this
 * file, not any call site.
 */

export const SM_INTEGRATION_UNAVAILABLE_REASON =
  "Live SM Markets pricing isn't available in this build — there's no connected SM data source. See README.md.";

function unavailable<T>(): SmAdapterResult<T> {
  return { status: "integration-unavailable", reason: SM_INTEGRATION_UNAVAILABLE_REASON };
}

export async function searchSmProducts(_query: string, _storeId: string): Promise<SmAdapterResult<SmLiveProduct[]>> {
  return unavailable();
}

export async function getSmProduct(_sku: string, _storeId: string): Promise<SmAdapterResult<SmLiveProduct>> {
  return unavailable();
}

export async function refreshBasketPrices(_skus: string[], _storeId: string): Promise<SmAdapterResult<SmLiveProduct[]>> {
  return unavailable();
}

const LIVE_MINUTES = 30;
const RECENTLY_CHECKED_MINUTES = 6 * 60;

/**
 * Classifies how fresh a live price is, per the freshness tiers a real
 * adapter would need (<30min live, 30min-6hr recently-checked, >6hr
 * refresh-required). Real, tested logic — just unused today, since no
 * `fetchedAt` is ever populated without a live source.
 */
export function classifyFreshness(fetchedAt: string | undefined, now: Date = new Date()): LivePriceStatus {
  if (!fetchedAt) return "unavailable";
  const fetchedMs = new Date(fetchedAt).getTime();
  if (Number.isNaN(fetchedMs)) return "unavailable";
  const ageMinutes = (now.getTime() - fetchedMs) / 60_000;
  if (ageMinutes < 0) return "unavailable";
  if (ageMinutes < LIVE_MINUTES) return "live";
  if (ageMinutes < RECENTLY_CHECKED_MINUTES) return "recently-checked";
  return "refresh-required";
}
