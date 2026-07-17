import { describe, expect, it } from "vitest";
import { mapNominatimAddress } from "@/lib/pricing/geocoding";

describe("mapNominatimAddress", () => {
  it("prefers city, falling back to municipality then town", () => {
    expect(mapNominatimAddress({ city: "Imus" }).city).toBe("Imus");
    expect(mapNominatimAddress({ municipality: "Imus" }).city).toBe("Imus");
    expect(mapNominatimAddress({ town: "Imus" }).city).toBe("Imus");
  });

  it("prefers state, falling back to county, for province", () => {
    expect(mapNominatimAddress({ state: "Cavite" }).province).toBe("Cavite");
    expect(mapNominatimAddress({ county: "Cavite" }).province).toBe("Cavite");
  });

  it("never invents a field it doesn't have", () => {
    const mapped = mapNominatimAddress({});
    expect(mapped.city).toBeUndefined();
    expect(mapped.province).toBeUndefined();
    expect(mapped.region).toBeUndefined();
  });
});
