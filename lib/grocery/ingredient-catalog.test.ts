import { describe, expect, it } from "vitest";
import { getCanonicalKey, getCatalogEntry } from "@/lib/grocery/ingredient-catalog";

describe("getCanonicalKey", () => {
  it("lowercases and trims", () => {
    expect(getCanonicalKey("  Onion  ")).toBe("onion");
  });

  it("normalizes plain plurals", () => {
    expect(getCanonicalKey("Onions")).toBe("onion");
    expect(getCanonicalKey("Cloves")).toBe("clove");
  });

  it("normalizes -ies plurals", () => {
    expect(getCanonicalKey("Berries")).toBe("berry");
  });

  it("normalizes -oes/-shes/-ches/-xes plurals", () => {
    expect(getCanonicalKey("Tomatoes")).toBe("tomato");
    expect(getCanonicalKey("Dishes")).toBe("dish");
    expect(getCanonicalKey("Peaches")).toBe("peach");
  });

  it("leaves false plurals alone", () => {
    expect(getCanonicalKey("Hummus")).toBe("hummus");
    expect(getCanonicalKey("Asparagus")).toBe("asparagus");
  });

  it("resolves known aliases to the same canonical key", () => {
    expect(getCanonicalKey("Cilantro")).toBe(getCanonicalKey("Coriander"));
    expect(getCanonicalKey("Scallion")).toBe(getCanonicalKey("Green onion"));
    expect(getCanonicalKey("Garbanzo beans")).toBe(getCanonicalKey("Chickpeas"));
    expect(getCanonicalKey("Capsicum")).toBe(getCanonicalKey("Bell pepper"));
  });

  it("does NOT merge descriptively-qualified variants — they're different purchases", () => {
    expect(getCanonicalKey("Red onion")).not.toBe(getCanonicalKey("Onion"));
    expect(getCanonicalKey("Fresh basil")).not.toBe(getCanonicalKey("Basil"));
  });

  it("falls back to the singularized name for unknown ingredients", () => {
    expect(getCanonicalKey("Dragonfruits")).toBe("dragonfruit");
  });
});

describe("getCatalogEntry", () => {
  it("returns curated packages for a known ingredient", () => {
    const entry = getCatalogEntry("rice");
    expect(entry.packages.length).toBeGreaterThan(0);
    expect(entry.packages[0].form).toBe("kilogram");
  });

  it("marks curated staples as pantry shelf-life", () => {
    expect(getCatalogEntry("rice").shelfLife).toBe("pantry");
    expect(getCatalogEntry("cooking oil").shelfLife).toBe("pantry");
  });

  it("defaults unknown ingredients to perishable with no packages", () => {
    const entry = getCatalogEntry("dragonfruit");
    expect(entry.shelfLife).toBe("perishable");
    expect(entry.packages).toEqual([]);
  });
});
