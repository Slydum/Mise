import type { PriceAdapter, PriceAdapterParams, PriceAdapterResult } from "@/lib/pricing/types";

/**
 * PSA's Price Situationer releases — a newer, narrower set of selected
 * commodities than OpenSTAT's full tables. Preferred over OpenSTAT (see
 * lib/pricing/priority.ts's psaTieBreak) only for commodities the release
 * actually covers, never inferred for anything absent from it.
 *
 * No live connection for the same reason as psa-openstat.ts — this
 * session's outbound web access is blocked at the environment level for
 * every external host. See README.md.
 */
export const PSA_SITUATIONER_UNAVAILABLE_REASON =
  "No live connection to the PSA Price Situationer release. This session has no outbound web access — see README.md.";

export const psaSituationerAdapter: PriceAdapter = {
  source: "psa-price-situationer",
  async fetchPrices(_params: PriceAdapterParams): Promise<PriceAdapterResult> {
    return { status: "integration-unavailable", prices: [], reason: PSA_SITUATIONER_UNAVAILABLE_REASON };
  },
};
