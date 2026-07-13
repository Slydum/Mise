/**
 * Generates the PWA icon set in public/icons from assets/icon-source.png
 * (a pre-cleaned, truly transparent-cornered export — see
 * process-icon-source.mjs for how that was derived from the raw upload).
 *
 * One-off tool: `npm i --no-save sharp && node scripts/generate-icons.mjs`
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SOURCE = "assets/icon-source.png";
// Sampled from the icon's own background so corner fills / safe-zone padding
// blend seamlessly with the artwork.
const BACKGROUND = "#c8703a";

await mkdir("public/icons", { recursive: true });

// Regular icons keep the artwork's own transparent rounded corners — browsers
// and Android (non-maskable) render these as-is.
await sharp(SOURCE).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(SOURCE).resize(512, 512).png().toFile("public/icons/icon-512.png");
console.log("wrote icon-192.png, icon-512.png");

// Next.js metadata icon / favicon — same treatment as icon-192.
await sharp(SOURCE).resize(192, 192).png().toFile("app/icon.png");
console.log("wrote app/icon.png");

// Maskable: fill the transparent corners with the icon's own background
// (maskable icons must be fully opaque), then inset the whole glyph to ~72%
// so nothing critical is lost when the OS crops to a circle/squircle.
const opaqueSquare = await sharp(SOURCE)
  .flatten({ background: BACKGROUND })
  .resize(370, 370)
  .png()
  .toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: BACKGROUND },
})
  .composite([{ input: opaqueSquare, gravity: "center" }])
  .png()
  .toFile("public/icons/icon-maskable-512.png");
console.log("wrote icon-maskable-512.png");

// Apple touch icon: iOS applies its own corner rounding and mishandles
// transparency (older versions fill it with black), so flatten to opaque
// full-bleed square.
await sharp(SOURCE)
  .flatten({ background: BACKGROUND })
  .resize(180, 180)
  .png()
  .toFile("public/icons/apple-touch-icon.png");
console.log("wrote apple-touch-icon.png");
