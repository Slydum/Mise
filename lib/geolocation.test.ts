import { describe, expect, it } from "vitest";
import { haversineDistanceMeters } from "@/lib/geolocation";

describe("haversineDistanceMeters", () => {
  it("is zero for the same point", () => {
    expect(haversineDistanceMeters({ lat: 14.4297, lon: 120.9367 }, { lat: 14.4297, lon: 120.9367 })).toBe(0);
  });

  it("computes a realistic distance between two known Metro Manila points", () => {
    // Imus, Cavite to SM Mall of Asia, Pasay — roughly 15-18 km apart.
    const imus = { lat: 14.4297, lon: 120.9367 };
    const moa = { lat: 14.5352, lon: 120.9819 };
    const distance = haversineDistanceMeters(imus, moa);
    expect(distance).toBeGreaterThan(10_000);
    expect(distance).toBeLessThan(25_000);
  });

  it("is symmetric", () => {
    const a = { lat: 14.4, lon: 121.0 };
    const b = { lat: 14.6, lon: 121.2 };
    expect(haversineDistanceMeters(a, b)).toBeCloseTo(haversineDistanceMeters(b, a), 6);
  });
});
