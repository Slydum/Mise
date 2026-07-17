import type { PriceAdapter, PriceAdapterParams, PriceAdapterResult } from "@/lib/pricing/types";

/**
 * DTI e-Presyo monitored prices for basic necessities and prime
 * commodities. Per the DTI section of the spec this implements: consume
 * structured data server-side if DTI provides it, otherwise build an
 * isolated parser for official downloadable files/pages — but never bypass
 * authentication, CAPTCHA, or anti-bot controls, and never fabricate a
 * value when retrieval isn't available.
 *
 * This session's outbound web access is blocked at the environment/proxy
 * level for every external host, DTI's domain included (verified directly
 * against dti.gov.ph, not assumed) — so there is nothing to parse yet. See
 * README.md for what a real implementation needs.
 */
export const DTI_EPRESYO_UNAVAILABLE_REASON =
  "No live connection to DTI e-Presyo. This session has no outbound web access to dti.gov.ph — see README.md.";

export const dtiEpresyoAdapter: PriceAdapter = {
  source: "dti-epresyo",
  async fetchPrices(_params: PriceAdapterParams): Promise<PriceAdapterResult> {
    return { status: "integration-unavailable", prices: [], reason: DTI_EPRESYO_UNAVAILABLE_REASON };
  },
};
