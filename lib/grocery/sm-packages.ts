/**
 * Curated mock retail-package data, modeled on common SM Supermarket package
 * sizes (Philippines). Deliberately a small, hand-picked list, not scraped —
 * per instruction, no price data yet; that's a follow-up once package
 * selection itself has test coverage. `amount` is in the ingredient's base
 * unit (grams for mass, milliliters for volume, or the same discrete unit
 * the ingredient is normally measured in, e.g. "piece"/"can").
 */

export type PackageForm = "piece" | "bunch" | "can" | "sachet" | "pack" | "bottle" | "tray" | "kilogram";

export interface RetailPackage {
  form: PackageForm;
  label: string;
  /** Quantity contained in one package, in the ingredient's base unit. */
  amount: number;
}

export const SM_PACKAGES: Record<string, RetailPackage[]> = {
  rice: [{ form: "kilogram", label: "1 kg bag", amount: 1000 }],
  onion: [{ form: "kilogram", label: "1 kg", amount: 1000 }],
  garlic: [{ form: "sachet", label: "peeled garlic sachet (100 g)", amount: 100 }],
  "cooking oil": [{ form: "bottle", label: "1 L bottle", amount: 1000 }],
  "soy sauce": [{ form: "bottle", label: "200 ml bottle", amount: 200 }],
  "canned tuna": [{ form: "can", label: "can (155 g)", amount: 1 }],
  egg: [{ form: "tray", label: "tray of 30", amount: 30 }],
  banana: [{ form: "bunch", label: "bunch of 6", amount: 6 }],
  "powdered milk": [{ form: "sachet", label: "sachet (33 g)", amount: 33 }],
  pasta: [{ form: "pack", label: "500 g pack", amount: 500 }],
  bread: [{ form: "pack", label: "loaf (20 slices)", amount: 20 }],
  chicken: [{ form: "kilogram", label: "1 kg", amount: 1000 }],
  "bell pepper": [{ form: "piece", label: "piece", amount: 1 }],
  "spring onion": [{ form: "bunch", label: "bunch (100 g)", amount: 100 }],
};
