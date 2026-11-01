import { createClient } from "@supabase/supabase-js";

let client;

/**
 * The browser Supabase client: the visitor's session (kept in localStorage), auth
 * calls and photo uploads. Created on first use, in the browser only — server code
 * gets its own per-request client as `context.getSupabase()` (src/lib/auth-middleware.js).
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are compiled into the bundle at build
 * time; the anon key is public by design, row level security does the protecting.
 */
export function browserSupabase() {
  if (typeof window === "undefined") throw new Error("browserSupabase() is browser-only; server code uses context.getSupabase()");
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set at build time");
  client = createClient(url, anonKey);
  return client;
}
