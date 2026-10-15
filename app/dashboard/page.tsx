import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export const metadata = { title: "Dashboard | diBiti" };

export default async function Dashboard() {
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

  // No company yet: send them through the guided setup first.
  if (!membership) redirect("/onboarding");

  const companyId = membership.company_id as string;
  const [{ data: company }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
    supabase.from("company_profiles").select("*").eq("company_id", companyId).maybeSingle(),
  ]);

  const rows: { label: string; value: string }[] = [
    { label: "What you do", value: profile?.what_we_do ?? "" },
    { label: "Products and services", value: profile?.products ?? "" },
    { label: "Customers", value: profile?.audience ?? "" },
    { label: "Voice", value: [...(profile?.tone ?? []), profile?.voice_notes].filter(Boolean).join(". ") },
    { label: "Always do", value: profile?.dos ?? "" },
    { label: "Never do", value: profile?.donts ?? "" },
  ];

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="brand">diBiti</span>
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost btn-small" type="submit">
            Sign out
          </button>
        </form>
      </header>

      <section className="app-main">
        <h1>{company?.name ?? "Your company"}</h1>
        <p className="muted">Signed in as {user.email}</p>

        <div className="panel">
          <div className="panel-head">
            <h2>Company profile</h2>
            <Link href="/onboarding" className="btn btn-ghost btn-small">
              Edit
            </Link>
          </div>
          <dl className="profile-list">
            {rows.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value || "Not added yet"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="panel">
          <h2>Your team</h2>
          <p className="muted">
            Your Social Media Manager is next. It will use this profile to plan
            and draft posts, and you will approve each one.
          </p>
        </div>
      </section>
    </main>
  );
}
