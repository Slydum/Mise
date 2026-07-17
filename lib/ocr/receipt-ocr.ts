/**
 * On-device receipt OCR — runs entirely in the browser via Tesseract.js
 * (WASM), no server or API key needed. Lazy-imported so the ~2MB engine
 * only loads when the user actually taps "Scan a receipt," never bloating
 * the app's initial bundle.
 *
 * Tesseract.js fetches its English language data from a CDN the first time
 * it runs (cached in the browser afterward), so this needs real internet
 * access — the same "genuinely works in the user's own browser" situation
 * as lib/geolocation.ts, distinct from this coding session's own blocked
 * sandbox network. Not verified end-to-end here for the same reason: no way
 * to actually run OCR against a real receipt photo from this session.
 *
 * Extraction is intentionally a suggestion, never an answer: OCR on
 * thermal-printed receipts is noisy, so this only ever surfaces candidate
 * numbers for the user to tap-confirm (see components/grocery/price-detail-
 * sheet.tsx) — it never auto-fills or auto-saves a price.
 */

export interface OcrCandidatePrice {
  value: number;
  /** The receipt line the price was found on, so the user can tell "TOTAL 245.00" apart from "CASH 300.00". */
  context: string;
}

export interface ReceiptOcrResult {
  rawText: string;
  candidates: OcrCandidatePrice[];
}

/**
 * Matches the standard peso price format: digits, optional thousands
 * commas, exactly two decimal places. Deliberately not matching bare
 * integers (usually quantities) or dates. The digit-boundary lookarounds
 * stop it from grabbing a plausible-looking tail out of a longer,
 * comma-free digit run (e.g. a misread barcode) — "567.00" is not a real
 * candidate hiding inside "1234567.00".
 */
const PRICE_NUMBER_PATTERN = /(?<!\d)\d{1,3}(?:,\d{3})*\.\d{2}(?!\d)/g;

/**
 * Pure text-scanning step, separated from the OCR engine so it's directly
 * unit-testable against fixture strings without needing a real image or
 * network access. Never invents a price that isn't actually printed —
 * numbers are read verbatim from the OCR text, deduplicated, and bounded to
 * a plausible range (0, 999999] to filter out obvious OCR noise like a
 * misread barcode digit run.
 */
export function extractCandidatePrices(rawText: string): OcrCandidatePrice[] {
  const seen = new Set<number>();
  const candidates: OcrCandidatePrice[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const matches = line.match(PRICE_NUMBER_PATTERN);
    if (!matches) continue;
    for (const match of matches) {
      const value = Number(match.replace(/,/g, ""));
      if (!Number.isFinite(value) || value <= 0 || value > 999_999) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      candidates.push({ value, context: line });
    }
  }

  return candidates;
}

/** Runs OCR on a receipt photo and extracts candidate prices. Thin I/O wrapper around Tesseract.js — see extractCandidatePrices for the tested logic. */
export async function runReceiptOcr(image: Blob): Promise<ReceiptOcrResult> {
  const Tesseract = (await import("tesseract.js")).default;
  const worker = await Tesseract.createWorker("eng");
  try {
    const { data } = await worker.recognize(image);
    return { rawText: data.text, candidates: extractCandidatePrices(data.text) };
  } finally {
    await worker.terminate();
  }
}
