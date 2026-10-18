import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgentProfile } from "./agents/smm";

// Loads the company profile in the shape the agents read it.
export async function loadAgentProfile(
  supabase: SupabaseClient,
  companyId: string
): Promise<AgentProfile> {
  const [{ data: company }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
    supabase.from("company_profiles").select("*").eq("company_id", companyId).maybeSingle(),
  ]);
  return {
    name: company?.name ?? "Your business",
    whatWeDo: profile?.what_we_do ?? "",
    products: profile?.products ?? "",
    audience: profile?.audience ?? "",
    tone: profile?.tone ?? [],
    voiceNotes: profile?.voice_notes ?? "",
    dos: profile?.dos ?? "",
    donts: profile?.donts ?? "",
  };
}

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
