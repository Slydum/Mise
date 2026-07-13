import type { MetadataRoute } from "next";

// Required for `output: "export"` (GitHub Pages build).
export const dynamic = "force-static";

// Deploy-target subpath (e.g. "/Mise" on GitHub Pages); Next.js does not
// prefix manifest URLs with basePath automatically.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mise — Meal Planner",
    short_name: "Mise",
    description: "Plan your meals, cook with ease.",
    id: `${basePath}/`,
    start_url: `${basePath}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f3",
    theme_color: "#faf8f3",
    categories: ["food", "lifestyle", "health"],
    icons: [
      {
        src: `${basePath}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${basePath}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${basePath}/icons/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
