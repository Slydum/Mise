import { describe, expect, it } from "vitest";
import { extractCandidatePrices } from "@/lib/ocr/receipt-ocr";

describe("extractCandidatePrices", () => {
  it("reads a simple total line", () => {
    const candidates = extractCandidatePrices("TOTAL   245.00");
    expect(candidates).toEqual([{ value: 245, context: "TOTAL   245.00" }]);
  });

  it("keeps the context line so the user can tell items apart from totals", () => {
    const text = "ONIONS RED       85.00\nTOTAL           245.00\nCASH            300.00";
    const candidates = extractCandidatePrices(text);
    expect(candidates.map((c) => c.context)).toEqual([
      "ONIONS RED       85.00",
      "TOTAL           245.00",
      "CASH            300.00",
    ]);
  });

  it("strips thousands-separator commas", () => {
    expect(extractCandidatePrices("SUBTOTAL 1,250.00")).toEqual([{ value: 1250, context: "SUBTOTAL 1,250.00" }]);
  });

  it("ignores bare integers (usually quantities), which have no decimal part", () => {
    expect(extractCandidatePrices("QTY 2")).toEqual([]);
  });

  it("ignores numbers without exactly two decimal digits", () => {
    expect(extractCandidatePrices("WEIGHT 1.5 KG")).toEqual([]);
  });

  it("deduplicates the same value appearing twice", () => {
    const candidates = extractCandidatePrices("85.00 x 1\nLINE TOTAL 85.00");
    expect(candidates).toHaveLength(1);
  });

  it("filters out implausible OCR noise (zero or absurdly large)", () => {
    expect(extractCandidatePrices("0.00")).toEqual([]);
    expect(extractCandidatePrices("1234567.00")).toEqual([]);
  });

  it("returns an empty list for text with no price-shaped numbers", () => {
    expect(extractCandidatePrices("THANK YOU FOR SHOPPING\nSM SUPERMARKET IMUS")).toEqual([]);
  });
});
