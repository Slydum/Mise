import { describe, expect, it } from "vitest";
import { extractCandidatePrices } from "@/lib/ocr/receipt-ocr";

describe("extractCandidatePrices", () => {
  it("reads a simple item line", () => {
    const candidates = extractCandidatePrices("ONIONS RED       245.00");
    expect(candidates).toEqual([{ value: 245, context: "ONIONS RED       245.00" }]);
  });

  it("keeps the context line so the user can tell one item apart from another", () => {
    const text = "ONIONS RED       85.00\nGARLIC WHOLE     45.00";
    const candidates = extractCandidatePrices(text);
    expect(candidates.map((c) => c.context)).toEqual(["ONIONS RED       85.00", "GARLIC WHOLE     45.00"]);
  });

  it("excludes subtotal/total/cash/change/VAT lines — never an item's price", () => {
    const text = [
      "AVOCADO HASS     31.19",
      "SUBTOTAL         69.63",
      "TOTAL (2 ITEMS)  69.63",
      "CASH            100.00",
      "CHANGE           30.37",
      "(V) VATABLE      69.63",
      "12% VAT           7.46",
    ].join("\n");
    const candidates = extractCandidatePrices(text);
    expect(candidates).toEqual([{ value: 31.19, context: "AVOCADO HASS     31.19" }]);
  });

  it("strips thousands-separator commas", () => {
    expect(extractCandidatePrices("GROCERY BAG 1,250.00")).toEqual([{ value: 1250, context: "GROCERY BAG 1,250.00" }]);
  });

  it("ignores bare integers (usually quantities), which have no decimal part", () => {
    expect(extractCandidatePrices("QTY 2")).toEqual([]);
  });

  it("ignores numbers without exactly two decimal digits", () => {
    expect(extractCandidatePrices("WEIGHT 1.5 KG")).toEqual([]);
  });

  it("deduplicates the same value appearing twice", () => {
    const candidates = extractCandidatePrices("85.00 x 1\nAVOCADO HASS 85.00");
    expect(candidates).toHaveLength(1);
  });

  it("filters out implausible OCR noise (zero or absurdly large)", () => {
    expect(extractCandidatePrices("0.00")).toEqual([]);
    expect(extractCandidatePrices("1234567.00")).toEqual([]);
  });

  it("returns an empty list for text with no price-shaped numbers", () => {
    expect(extractCandidatePrices("THANK YOU FOR SHOPPING\nSM SUPERMARKET IMUS")).toEqual([]);
  });

  it("doesn't misfire on a product name that merely contains a noise word as a substring", () => {
    // "Cashew" contains "cash" but isn't the standalone word "cash" — word-boundary match must not catch it.
    expect(extractCandidatePrices("CASHEW NUTS 120.00")).toEqual([{ value: 120, context: "CASHEW NUTS 120.00" }]);
  });
});
