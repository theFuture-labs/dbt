"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { getCompanyId } from "../../lib/company";
import { draftPosts, SMM_KEY, type AgentProfile } from "../../lib/agents/smm";

const MAX_PENDING = 30;

export async function draftPostsAction(): Promise<{
  error?: string;
  count?: number;
  source?: "demo" | "claude";
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) return { error: "Finish your company profile first." };

  // Cost and clutter guard: review what is waiting before asking for more.
  const { count: pending } = await supabase
    .from("proposed_actions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("type", "social_post")
    .eq("status", "pending");
  if ((pending ?? 0) >= MAX_PENDING) {
    return { error: "You have a lot of drafts waiting. Approve or reject some first." };
  }

  const [{ data: company }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
    supabase.from("company_profiles").select("*").eq("company_id", companyId).maybeSingle(),
  ]);

  const agentProfile: AgentProfile = {
    name: company?.name ?? "Your business",
    whatWeDo: profile?.what_we_do ?? "",
    products: profile?.products ?? "",
    audience: profile?.audience ?? "",
    tone: profile?.tone ?? [],
    voiceNotes: profile?.voice_notes ?? "",
    dos: profile?.dos ?? "",
    donts: profile?.donts ?? "",
  };

  let result;
  try {
    result = await draftPosts(agentProfile, 5);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The agent could not write drafts." };
  }

  const { data: saved, error } = await supabase.rpc("propose_actions", {
    p_agent: SMM_KEY,
    p_source: result.source,
    p_items: result.items,
  });
  if (error) return { error: "Drafts were written but could not be saved. Please try again." };

  revalidatePath("/dashboard");
  revalidatePath("/queue");
  revalidatePath("/audit");
  return { count: saved as number, source: result.source };
}
