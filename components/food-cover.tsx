import { cn } from "@/lib/utils";
import type { Recipe } from "@/lib/types";

/**
 * Cover art for a recipe. Renders `recipe.imageUrl` when present; otherwise
 * falls back to a deterministic, art-directed illustration — a gradient
 * backdrop, layered decorative shapes, a soft "plate" beneath the mark, a
 * paper-grain texture, and a large emoji — so every recipe still reads as an
 * intentional, premium cover before real photography is wired in (see
 * lib/types.ts Recipe.imageUrl).
 */

const GRADIENTS = [
  ["#f4e3c8", "#e3bd8d"], // toasted sand
  ["#ecdfc2", "#cdb689"], // wheat
  ["#ecdad0", "#d8ab8c"], // clay
  ["#e4e8d5", "#bfc9a4"], // sage mist
  ["#f1ddce", "#dda183"], // terracotta blush
  ["#e9e1d0", "#c7b78f"], // linen
  ["#dfe6df", "#a9baa8"], // eucalyptus
];

// Soft accent tones for the decorative layered shapes — pulled from the
// existing design tokens (pale sage / pale terracotta / cream) so the
// illustration never introduces an off-palette color.
const BLOB_TONES = ["#e6ecdc", "#f4e2d3", "#fffcf7", "#c9d6c0"];

/** Subtle paper-grain noise, matching the app icon's texture. Inlined once as a constant. */
const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function hashIndex(id: string, mod: number, salt = 0): number {
  let hash = salt;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1 + salt)) % mod;
  return hash;
}

const ASPECT = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  wide: "aspect-[16/10]",
  hero: "aspect-[4/3]",
} as const;

interface FoodCoverProps {
  recipe: Pick<Recipe, "id" | "emoji" | "imageUrl" | "title">;
  aspect?: keyof typeof ASPECT;
  rounded?: string;
  emojiClassName?: string;
  className?: string;
}

export function FoodCover({
  recipe,
  aspect = "square",
  rounded = "rounded-3xl",
  emojiClassName,
  className,
}: FoodCoverProps) {
  if (recipe.imageUrl) {
    return (
      <div className={cn("relative overflow-hidden", ASPECT[aspect], rounded, className)}>
        <img
          src={recipe.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
      </div>
    );
  }

  const [from, to] = GRADIENTS[hashIndex(recipe.id, GRADIENTS.length)];
  // Small thumbnails (meal rows, quick-add) skip the layered detail — at
  // 48-56px it would just read as mush — and keep a clean, legible mark.
  const detailed = aspect !== "square";
  const blobA = BLOB_TONES[hashIndex(recipe.id, BLOB_TONES.length, 1)];
  const blobB = BLOB_TONES[hashIndex(recipe.id, BLOB_TONES.length, 2)];

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        ASPECT[aspect],
        rounded,
        className,
      )}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {detailed ? (
        <>
          <span
            className="absolute -left-[12%] -top-[10%] size-[48%] rounded-full opacity-40 blur-[1px]"
            style={{ background: blobA }}
          />
          <span
            className="absolute -bottom-[14%] -right-[10%] size-[58%] rounded-full opacity-35 blur-[1px]"
            style={{ background: blobB }}
          />
        </>
      ) : null}

      {/* soft top-left highlight / bottom-right shadow for a sense of light */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.5), transparent 55%), radial-gradient(circle at 78% 85%, rgba(0,0,0,0.12), transparent 60%)",
        }}
      />

      {/* paper-grain texture */}
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")`, backgroundSize: "180px 180px" }}
      />

      {detailed ? (
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 size-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-[2px]"
        />
      ) : null}

      <span
        className={cn(
          "relative drop-shadow-[0_8px_16px_rgba(44,38,30,0.22)]",
          emojiClassName ?? (detailed ? "text-7xl" : "text-5xl"),
        )}
      >
        {recipe.emoji}
      </span>
    </div>
  );
}
