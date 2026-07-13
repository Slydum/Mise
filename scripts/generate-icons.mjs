/**
 * Generates the PWA icon set in public/icons from an inline SVG.
 * One-off tool: `npm i --no-save sharp && node scripts/generate-icons.mjs`
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Sage rounded square with a minimal plate + steam mark.
function iconSvg({ padding = 0 } = {}) {
  const inset = 512 * padding;
  const s = 512 - inset * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" fill="#7c8f6d"/>
  <g transform="translate(${inset} ${inset}) scale(${s / 512})">
    <!-- plate -->
    <circle cx="256" cy="308" r="130" fill="none" stroke="#faf8f3" stroke-width="26"/>
    <circle cx="256" cy="308" r="64" fill="#faf8f3"/>
    <!-- steam -->
    <path d="M216 118c0-20 16-24 16-40" fill="none" stroke="#faf8f3" stroke-width="20" stroke-linecap="round"/>
    <path d="M256 128c0-24 18-28 18-48" fill="none" stroke="#faf8f3" stroke-width="20" stroke-linecap="round"/>
    <path d="M298 118c0-20 16-24 16-40" fill="none" stroke="#faf8f3" stroke-width="20" stroke-linecap="round"/>
  </g>
</svg>`;
}

await mkdir("public/icons", { recursive: true });

const jobs = [
  { file: "public/icons/icon-192.png", size: 192, svg: iconSvg() },
  { file: "public/icons/icon-512.png", size: 512, svg: iconSvg() },
  // Maskable: keep artwork inside the 80% safe zone.
  { file: "public/icons/icon-maskable-512.png", size: 512, svg: iconSvg({ padding: 0.1 }) },
  { file: "public/icons/apple-touch-icon.png", size: 180, svg: iconSvg() },
];

for (const { file, size, svg } of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  console.log("wrote", file);
}
