import { describe, expect, it } from "vitest";
import { geographicLevelLabel, geographicLevelOf, resolveGeographicFallback } from "@/lib/pricing/geographic";

describe("resolveGeographicFallback", () => {
  it("prefers city over province, region, and national", () => {
    const result = resolveGeographicFallback({ city: "Imus", province: "Cavite", region: "CALABARZON", national: "PH" });
    expect(result).toEqual({ level: "city", value: "Imus" });
  });

  it("falls back to province when there's no city figure", () => {
    const result = resolveGeographicFallback({ province: "Cavite", region: "CALABARZON", national: "PH" });
    expect(result).toEqual({ level: "province", value: "Cavite" });
  });

  it("falls back to region when there's no city or province figure", () => {
    const result = resolveGeographicFallback({ region: "CALABARZON", national: "PH" });
    expect(result).toEqual({ level: "region", value: "CALABARZON" });
  });

  it("falls back to national only when nothing more local is available", () => {
    const result = resolveGeographicFallback({ national: "PH" });
    expect(result).toEqual({ level: "national", value: "PH" });
  });

  it("returns undefined when there is no data at any level — never invents a level", () => {
    expect(resolveGeographicFallback({})).toBeUndefined();
  });
});

describe("geographicLevelLabel", () => {
  it("labels each level distinctly so a national figure is never mistaken for a local one", () => {
    expect(geographicLevelLabel("city")).toBe("City reference");
    expect(geographicLevelLabel("province")).toBe("Provincial reference");
    expect(geographicLevelLabel("region")).toBe("Regional reference");
    expect(geographicLevelLabel("national")).toBe("National reference");
  });
});

describe("geographicLevelOf", () => {
  it("derives city when a city is present, regardless of broader fields", () => {
    expect(geographicLevelOf({ city: "Imus", province: "Cavite", region: "CALABARZON" })).toBe("city");
  });

  it("derives province when there's a province but no city", () => {
    expect(geographicLevelOf({ province: "Cavite", region: "CALABARZON" })).toBe("province");
  });

  it("derives region when there's only a region", () => {
    expect(geographicLevelOf({ region: "CALABARZON" })).toBe("region");
  });

  it("derives national when nothing geographic is set", () => {
    expect(geographicLevelOf({})).toBe("national");
  });
});
