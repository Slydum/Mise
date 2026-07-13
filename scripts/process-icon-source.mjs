/**
 * The uploaded icon export has no real alpha channel — the "transparency" is
 * a checkerboard pattern painted into the pixels. This crops tightly to the
 * rounded-square glyph and rebuilds real alpha.
 *
 * The tricky part: the design itself has a thin bright near-white rim-light
 * around the cream shapes that is colorimetrically identical to the
 * checkerboard tiles (~240-254, near-zero chroma), so a plain color
 * threshold cuts holes in the artwork. Instead, flood-fill from the four
 * corners of the crop (which are guaranteed to be checkerboard) through
 * connected checkerboard-colored pixels only — the rim-light pixels are
 * enclosed by opaque cream/terracotta and never connect to the border, so
 * they survive untouched.
 *
 * One-off tool: `npm i --no-save sharp && node scripts/process-icon-source.mjs`
 */
import sharp from "sharp";

const SRC = "assets/icon-source-raw.png";
const OUT_TRANSPARENT = "assets/icon-source.png";

function chroma(r, g, b) {
  return Math.max(r, g, b) - Math.min(r, g, b);
}

function isCheckerboardColor(r, g, b) {
  return chroma(r, g, b) <= 16 && Math.min(r, g, b) > 210;
}

async function main() {
  const img = sharp(SRC).raw();
  const { data, info } = await img.toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const at = (x, y) => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // Tight bounding box of the glyph itself (excludes checkerboard + soft shadow).
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = at(x, y);
      if (chroma(r, g, b) > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  console.log("glyph bbox:", { minX, minY, boxW, boxH });

  const rgb = new Uint8Array(boxW * boxH * 3);
  const candidate = new Uint8Array(boxW * boxH); // 1 if checkerboard-colored
  for (let y = 0; y < boxH; y++) {
    for (let x = 0; x < boxW; x++) {
      const [r, g, b] = at(minX + x, minY + y);
      const pi = y * boxW + x;
      rgb[pi * 3] = r;
      rgb[pi * 3 + 1] = g;
      rgb[pi * 3 + 2] = b;
      candidate[pi] = isCheckerboardColor(r, g, b) ? 1 : 0;
    }
  }

  // Flood-fill from the four crop corners through 4-connected candidate pixels.
  const transparent = new Uint8Array(boxW * boxH);
  const stack = [];
  const seed = (x, y) => {
    const pi = y * boxW + x;
    if (candidate[pi]) stack.push(pi);
  };
  seed(0, 0);
  seed(boxW - 1, 0);
  seed(0, boxH - 1);
  seed(boxW - 1, boxH - 1);

  while (stack.length > 0) {
    const pi = stack.pop();
    if (transparent[pi]) continue;
    transparent[pi] = 1;
    const x = pi % boxW;
    const y = (pi - x) / boxW;
    if (x > 0 && candidate[pi - 1] && !transparent[pi - 1]) stack.push(pi - 1);
    if (x < boxW - 1 && candidate[pi + 1] && !transparent[pi + 1]) stack.push(pi + 1);
    if (y > 0 && candidate[pi - boxW] && !transparent[pi - boxW]) stack.push(pi - boxW);
    if (y < boxH - 1 && candidate[pi + boxW] && !transparent[pi + boxW]) stack.push(pi + boxW);
  }

  const cropped = Buffer.alloc(boxW * boxH * 4);
  for (let pi = 0; pi < boxW * boxH; pi++) {
    cropped[pi * 4] = rgb[pi * 3];
    cropped[pi * 4 + 1] = rgb[pi * 3 + 1];
    cropped[pi * 4 + 2] = rgb[pi * 3 + 2];
    cropped[pi * 4 + 3] = transparent[pi] ? 0 : 255;
  }

  await sharp(cropped, { raw: { width: boxW, height: boxH, channels: 4 } })
    .png()
    .toFile(OUT_TRANSPARENT);
  console.log("wrote", OUT_TRANSPARENT);
}

main();
