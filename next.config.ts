import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision = process.env.NEXT_PUBLIC_BUILD_ID ?? crypto.randomUUID();

// Static-export mode (used by the GitHub Pages deploy): serves the app from
// a subpath (e.g. https://<user>.github.io/Mise) with trailing-slash URLs so
// every route maps to a real <route>/index.html file.
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const shellPages = ["/", "/plan", "/recipes", "/grocery", "/profile", "/~offline"];

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Precache the core app shell so Today, Plan, Recipes, and Grocery all
  // work offline (mock data currently ships inside the JS bundles).
  additionalPrecacheEntries: shellPages.map((page) => ({
    url: isStaticExport ? `${basePath}${page === "/" ? "" : page}/` : page,
    revision,
  })),
});

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        basePath: basePath || undefined,
        trailingSlash: true,
      }
    : {}),
};

export default withSerwist(nextConfig);
