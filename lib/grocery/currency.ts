/** Philippine peso formatting for estimated SM grocery prices — always approximate. */

// maximumFractionDigits: 0 — sub-peso precision would imply false accuracy for an estimate.
const PHP_FORMATTER = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export function formatPhp(amountPhp: number): string {
  return PHP_FORMATTER.format(Math.round(amountPhp));
}

/** Prefixes with ≈ since SM prices vary by branch, brand, promotion, and stock. */
export function formatApproxPhp(amountPhp: number): string {
  return `≈ ${formatPhp(amountPhp)}`;
}
