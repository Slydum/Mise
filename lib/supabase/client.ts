import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client scaffold. Not used yet — the app currently runs on the mock
 * provider in `lib/data/index.ts`. To go live:
 *
 *   1. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *      (see .env.example).
 *   2. Reimplement the functions in `lib/data/index.ts` against these tables:
 *        recipes, planned_meals, grocery_items, profiles
 *   3. Keep `lib/data/local-store.ts` as the offline-first cache and sync it
 *      when connectivity returns.
 */

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  client ??= createClient(url, anonKey);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
