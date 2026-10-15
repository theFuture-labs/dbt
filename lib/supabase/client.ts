import { createBrowserClient } from "@supabase/ssr";

// Supabase client for code that runs in the browser (the sign-in button).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
