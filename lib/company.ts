import type { SupabaseClient } from "@supabase/supabase-js";

// Finds which company the signed-in person belongs to (one company per user for now).
export async function getCompanyId(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("memberships")
    .select("company_id")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.company_id as string | undefined) ?? null;
}
