"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";
import { getCompanyId, loadAgentProfile } from "../../lib/company";
import {
  draftPlan,
  draftSlotPosts,
  SMM_KEY,
  type Plan,
  type Slot,
} from "../../lib/agents/smm";

const MAX_PENDING_POSTS = 30;
const POSTS_PER_BATCH = 5;

function refresh() {
  revalidatePath("/plan");
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
}

async function context() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, companyId: null, signedIn: false };
  const companyId = await getCompanyId(supabase, user.id);
  return { supabase, companyId, signedIn: true };
}

export async function createPlanAction(): Promise<{ error?: string }> {
  const { supabase, companyId, signedIn } = await context();
  if (!signedIn) return { error: "Please sign in again." };
  if (!companyId) return { error: "Finish your company profile first." };

  const { data: latest } = await supabase
    .from("proposed_actions")
    .select("status")
    .eq("company_id", companyId)
    .eq("type", "content_plan")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.status === "pending") {
    return { error: "You already have a plan waiting for your decision." };
  }

  const profile = await loadAgentProfile(supabase, companyId);

  let result;
  try {
    result = await draftPlan(profile);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The agent could not write a plan." };
  }

  const { error } = await supabase.rpc("propose_plan", {
    p_agent: SMM_KEY,
    p_source: result.source,
    p_plan: result.plan,
  });
  if (error) return { error: "The plan was written but could not be saved. Please try again." };

  refresh();
  return {};
}

export async function draftFromPlanAction(): Promise<{
  error?: string;
  count?: number;
  source?: "demo" | "claude";
}> {
  const { supabase, companyId, signedIn } = await context();
  if (!signedIn) return { error: "Please sign in again." };
  if (!companyId) return { error: "Finish your company profile first." };

  const { data: planRow } = await supabase
    .from("proposed_actions")
    .select("id, status, payload")
    .eq("company_id", companyId)
    .eq("type", "content_plan")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!planRow || planRow.status !== "approved") {
    return { error: "Approve your content plan before drafting posts from it." };
  }

  const { count: pending } = await supabase
    .from("proposed_actions")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("type", "social_post")
    .eq("status", "pending");
  if ((pending ?? 0) >= MAX_PENDING_POSTS) {
    return { error: "You have a lot of drafts waiting. Approve or reject some first." };
  }

  const plan = planRow.payload as Plan;
  const { data: existing } = await supabase
    .from("proposed_actions")
    .select("payload, status")
    .eq("plan_id", planRow.id)
    .neq("status", "rejected");
  const drafted = new Set<number>(
    (existing ?? []).map((r: { payload: { day?: number } }) => Number(r.payload?.day))
  );

  const todo: Slot[] = plan.slots.filter((s) => !drafted.has(s.day)).slice(0, POSTS_PER_BATCH);
  if (todo.length === 0) return { error: "Every slot in this plan already has a draft." };

  const profile = await loadAgentProfile(supabase, companyId);

  let result;
  try {
    result = await draftSlotPosts(profile, plan, todo);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The agent could not write drafts." };
  }

  const { data: saved, error } = await supabase.rpc("propose_plan_posts", {
    p_plan_id: planRow.id,
    p_source: result.source,
    p_items: result.items,
  });
  if (error) return { error: "Drafts were written but could not be saved. Please try again." };

  refresh();
  return { count: saved as number, source: result.source };
}
