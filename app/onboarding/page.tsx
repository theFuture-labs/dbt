import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { emptyProfile, type ProfileValues } from "../../lib/profile";
import ProfileForm from "./profile-form";

export const metadata = { title: "Company profile | diBiti" };

export default async function Onboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let initial: ProfileValues = emptyProfile;
  let editing = false;

  const { data: membership } = await supabase
    .from("memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membership) {
    editing = true;
    const companyId = membership.company_id as string;
    const [{ data: company }, { data: profile }] = await Promise.all([
      supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
      supabase.from("company_profiles").select("*").eq("company_id", companyId).maybeSingle(),
    ]);
    initial = {
      name: company?.name ?? "",
      whatWeDo: profile?.what_we_do ?? "",
      products: profile?.products ?? "",
      audience: profile?.audience ?? "",
      tone: profile?.tone ?? [],
      voiceNotes: profile?.voice_notes ?? "",
      dos: profile?.dos ?? "",
      donts: profile?.donts ?? "",
    };
  }

  return (
    <main className="auth-page">
      <div className="moon-mini" aria-hidden="true" />
      <ProfileForm initial={initial} editing={editing} />
    </main>
  );
}
