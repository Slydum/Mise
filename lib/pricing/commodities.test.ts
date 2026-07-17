import { describe, expect, it } from "vitest";
import { getCommodityMapping, listMappingsNeedingReview } from "@/lib/pricing/commodities";

describe("getCommodityMapping", () => {
  it("maps unambiguous ingredients directly, with no review needed", () => {
    const carrot = getCommodityMapping("carrot");
    expect(carrot?.commodityName).toBe("Carrot");
    expect(carrot?.needsReview).toBe(false);
  });

  it("keeps materially different commodities distinct — never substitutes across them", () => {
    expect(getCommodityMapping("salmon fillet")?.commodityName).toBeNull();
    expect(getCommodityMapping("canned tuna")?.commodityName).toBeNull();
    expect(getCommodityMapping("red cabbage")?.commodityName).toBeNull();
    expect(getCommodityMapping("sushi rice")?.commodityName).toBeNull();
  });

  it("flags ambiguous varieties (native/imported, red/white) for review instead of guessing silently", () => {
    expect(getCommodityMapping("garlic")?.needsReview).toBe(true);
    expect(getCommodityMapping("onion")?.needsReview).toBe(true);
  });

  it("returns undefined for an ingredient with no mapping entry at all", () => {
    expect(getCommodityMapping("quinoa-flour-blend-xyz")).toBeUndefined();
  });
});

describe("listMappingsNeedingReview", () => {
  it("only includes mappings explicitly flagged for review", () => {
    const reviewList = listMappingsNeedingReview();
    expect(reviewList.every((m) => m.needsReview)).toBe(true);
    expect(reviewList.some((m) => m.canonicalIngredientKey === "garlic")).toBe(true);
    expect(reviewList.some((m) => m.canonicalIngredientKey === "carrot")).toBe(false);
  });
});
