import { describe, expect, it } from "vitest";
import { dtiEpresyoAdapter } from "@/lib/pricing/adapters/dti-epresyo";
import { psaSituationerAdapter } from "@/lib/pricing/adapters/psa-situationer";

describe("dtiEpresyoAdapter", () => {
  it("never fabricates data — always reports integration-unavailable with an empty result", async () => {
    const result = await dtiEpresyoAdapter.fetchPrices({ region: "CALABARZON" });
    expect(result.status).toBe("integration-unavailable");
    expect(result.prices).toEqual([]);
    expect(result.reason).toBeTruthy();
  });
});

describe("psaSituationerAdapter", () => {
  it("never fabricates data — always reports integration-unavailable with an empty result", async () => {
    const result = await psaSituationerAdapter.fetchPrices({ province: "Cavite" });
    expect(result.status).toBe("integration-unavailable");
    expect(result.prices).toEqual([]);
    expect(result.reason).toBeTruthy();
  });
});
