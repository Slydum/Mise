import { describe, expect, it } from "vitest";
import { formatApproxPhp, formatPhp } from "@/lib/grocery/currency";

describe("formatPhp", () => {
  it("formats a peso amount with en-PH currency formatting", () => {
    expect(formatPhp(2485)).toBe("₱2,485");
  });

  it("rounds fractional pesos before formatting", () => {
    expect(formatPhp(219.6)).toBe("₱220");
  });

  it("formats zero", () => {
    expect(formatPhp(0)).toBe("₱0");
  });
});

describe("formatApproxPhp", () => {
  it("prefixes the formatted amount with the approx symbol", () => {
    expect(formatApproxPhp(2485)).toBe("≈ ₱2,485");
  });
});
