import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Offline strategy:
 * - The app shell (Today, Plan, Recipes, Grocery, Profile, offline fallback)
 *   is precached at install time via `additionalPrecacheEntries` in
 *   next.config.ts, alongside all build assets in __SW_MANIFEST.
 * - Meal plan, recipes, and grocery data currently ship inside the JS
 *   bundles (mock provider), so precaching the shell makes them fully
 *   available offline. User state lives in localStorage.
 * - `defaultCache` adds sensible runtime caching for everything else; when
 *   Supabase is integrated, add a NetworkFirst route for its REST calls here.
 */
// Serwist replaces this token at build time and requires it to appear
// exactly once, so capture it before using it in more than one place.
const precacheEntries = self.__SW_MANIFEST;

// The offline fallback URL depends on the deploy target (e.g. it gains a
// base path + trailing slash on GitHub Pages), so look up the exact key that
// was precached rather than hardcoding it.
const offlineFallbackUrl = (precacheEntries ?? [])
  .map((entry) => (typeof entry === "string" ? entry : entry.url))
  .find((url) => url.includes("~offline"));

const serwist = new Serwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: offlineFallbackUrl
    ? {
        entries: [
          {
            url: offlineFallbackUrl,
            matcher({ request }) {
              return request.destination === "document";
            },
          },
        ],
      }
    : undefined,
});

serwist.addEventListeners();
