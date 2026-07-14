import { describe, expect, it } from "vitest";
import { classifyFreshness, getSmProduct, refreshBasketPrices, searchSmProducts } from "@/lib/sm/adapter";

describe("SM adapter stubs never fabricate data", () => {
  it("searchSmProducts always reports the integration as unavailable", async () => {
    const result = await searchSmProducts("onion", "sm-fairview");
    expect(result.status).toBe("integration-unavailable");
    expect(result.data).toBeUndefined();
    expect(result.reason).toBeTruthy();
  });

  it("getSmProduct always reports the integration as unavailable", async () => {
    const result = await getSmProduct("SKU-123", "sm-fairview");
    expect(result.status).toBe("integration-unavailable");
    expect(result.data).toBeUndefined();
  });

  it("refreshBasketPrices always reports the integration as unavailable", async () => {
    const result = await refreshBasketPrices(["SKU-123", "SKU-456"], "sm-fairview");
    expect(result.status).toBe("integration-unavailable");
    expect(result.data).toBeUndefined();
  });
});

describe("classifyFreshness", () => {
  const now = new Date("2026-07-14T12:00:00Z");

  it("is unavailable when there's no fetch timestamp at all", () => {
    expect(classifyFreshness(undefined, now)).toBe("unavailable");
  });

  it("is live within 30 minutes", () => {
    expect(classifyFreshness("2026-07-14T11:45:00Z", now)).toBe("live");
  });

  it("is recently-checked between 30 minutes and 6 hours", () => {
    expect(classifyFreshness("2026-07-14T08:00:00Z", now)).toBe("recently-checked");
  });

  it("is refresh-required past 6 hours", () => {
    expect(classifyFreshness("2026-07-14T02:00:00Z", now)).toBe("refresh-required");
  });

  it("treats a future timestamp as unavailable rather than trusting it", () => {
    expect(classifyFreshness("2026-07-14T13:00:00Z", now)).toBe("unavailable");
  });
});
