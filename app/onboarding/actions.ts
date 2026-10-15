"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { TONE_OPTIONS, type ProfileValues } from "../../lib/profile";

const LIMIT = 2000;

function clean(value: unknown, max = LIMIT): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Saves the company profile. Creates the company the first time, updates it after.
export async function saveProfile(
  input: ProfileValues
): Promise<{ error: string } | undefined> {
  const name = clean(input?.name, 120);
  if (!name) return { error: "Add your business name to continue." };

  const tone = Array.isArray(input?.tone)
    ? input.tone.filter((t) => TONE_OPTIONS.includes(t)).slice(0, 4)
    : [];

  const fields = {
    what_we_do: clean(input?.whatWeDo),
    products: clean(input?.products),
    audience: clean(input?.audience),
    tone,
    voice_notes: clean(input?.voiceNotes),
    dos: clean(input?.dos),
    donts: clean(input?.donts),
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    const companyId = membership.company_id as string;
    // Run both saves at the same time instead of one after the other.
    const [{ error: nameError }, { error: profileError }] = await Promise.all([
      supabase.from("companies").update({ name }).eq("id", companyId),
      supabase.from("company_profiles").upsert({
        company_id: companyId,
        ...fields,
        updated_at: new Date().toISOString(),
      }),
    ]);
    if (nameError || profileError) {
      return { error: "We could not save your changes. Please try again." };
    }
  } else {
    const { error } = await supabase.rpc("create_company", {
      p_name: name,
      p_profile: fields,
    });
    if (error) {
      return { error: "We could not create your profile. Please try again." };
    }
  }

  redirect("/dashboard");
}
