import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision = process.env.NEXT_PUBLIC_BUILD_ID ?? crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // Precache the core app shell so Today, Plan, Recipes, and Grocery all
  // work offline (mock data currently ships inside the JS bundles).
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/plan", revision },
    { url: "/recipes", revision },
    { url: "/grocery", revision },
    { url: "/profile", revision },
    { url: "/~offline", revision },
  ],
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
