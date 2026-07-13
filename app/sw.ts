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
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
