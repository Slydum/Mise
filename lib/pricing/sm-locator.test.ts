import { describe, expect, it } from "vitest";
import { rankNearbyStores } from "@/lib/pricing/sm-locator";

const from = { lat: 14.4297, lon: 120.9367 }; // Imus, Cavite

describe("rankNearbyStores", () => {
  it("sorts results by distance, nearest first", () => {
    const elements = [
      { lat: 14.55, lon: 121.0, tags: { name: "SM Supermarket Far" } },
      { lat: 14.43, lon: 120.94, tags: { name: "SM Supermarket Near" } },
    ];
    const [first, second] = rankNearbyStores(elements, from);
    expect(first.name).toBe("SM Supermarket Near");
    expect(second.name).toBe("SM Supermarket Far");
  });

  it("reads coordinates from a way/relation's `center`, not just node lat/lon", () => {
    const elements = [{ center: { lat: 14.43, lon: 120.94 }, tags: { name: "SM Hypermarket Imus" } }];
    const [store] = rankNearbyStores(elements, from);
    expect(store.name).toBe("SM Hypermarket Imus");
    expect(store.distanceMeters).toBeGreaterThan(0);
  });

  it("skips elements with no usable coordinates rather than crashing", () => {
    const elements = [{ tags: { name: "SM Supermarket Nowhere" } }];
    expect(rankNearbyStores(elements, from)).toEqual([]);
  });

  it("deduplicates the same store reported as both a node and a way", () => {
    const elements = [
      { lat: 14.43, lon: 120.94, tags: { name: "SM Supermarket Imus" } },
      { center: { lat: 14.43, lon: 120.94 }, tags: { name: "SM Supermarket Imus" } },
    ];
    expect(rankNearbyStores(elements, from)).toHaveLength(1);
  });

  it("joins the street and city tags into a single address line when present", () => {
    const elements = [
      { lat: 14.43, lon: 120.94, tags: { name: "SM Supermarket Imus", "addr:street": "Emilio Aguinaldo Hwy", "addr:city": "Imus" } },
    ];
    const [store] = rankNearbyStores(elements, from);
    expect(store.address).toBe("Emilio Aguinaldo Hwy, Imus");
  });

  it("omits the address field entirely when no address tags are present — never fabricates one", () => {
    const elements = [{ lat: 14.43, lon: 120.94, tags: { name: "SM Supermarket Imus" } }];
    const [store] = rankNearbyStores(elements, from);
    expect(store.address).toBeUndefined();
  });

  it("caps results at the given limit", () => {
    const elements = Array.from({ length: 12 }, (_, i) => ({
      lat: 14.43 + i * 0.001,
      lon: 120.94,
      tags: { name: `SM Supermarket ${i}` },
    }));
    expect(rankNearbyStores(elements, from, 5)).toHaveLength(5);
  });
});
