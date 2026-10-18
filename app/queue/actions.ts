"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../../lib/supabase/server";

type Result = { error?: string };

function refresh() {
  revalidatePath("/queue");
  revalidatePath("/dashboard");
  revalidatePath("/audit");
}

export async function decideAction(
  id: string,
  decision: "approve" | "reject"
): Promise<Result> {
  if (typeof id !== "string" || (decision !== "approve" && decision !== "reject")) {
    return { error: "Something went wrong. Please try again." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_action", {
    p_id: id,
    p_decision: decision,
  });
  if (error) {
    return {
      error: error.message.includes("Already decided")
        ? "This post was already decided. Refresh the page."
        : "Could not save your decision. Please try again.",
    };
  }
  refresh();
  return {};
}

export async function editAction(id: string, text: string): Promise<Result> {
  if (typeof id !== "string" || typeof text !== "string") {
    return { error: "Something went wrong. Please try again." };
  }
  const clean = text.trim();
  if (clean.length === 0) return { error: "A post cannot be empty." };
  if (clean.length > 2200) return { error: "A post can be at most 2200 characters." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("edit_action", { p_id: id, p_text: clean });
  if (error) return { error: "Could not save your edit. Please try again." };
  refresh();
  return {};
}
