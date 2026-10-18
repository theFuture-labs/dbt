import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getCompanyId } from "../../lib/company";
import AppHeader from "../components/app-header";
import ActionCard from "./action-card";

export const metadata = { title: "Approval queue | diBiti" };

type Row = {
  id: string;
  payload: { platform: string; text: string };
  status: "pending" | "approved" | "rejected";
  source: "demo" | "claude";
};

export default async function Queue() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) redirect("/onboarding");

  const { data } = await supabase
    .from("proposed_actions")
    .select("id, payload, status, source")
    .eq("company_id", companyId)
    .eq("type", "social_post")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Row[];
  const groups: { title: string; status: Row["status"]; empty: string }[] = [
    { title: "Waiting for you", status: "pending", empty: "Nothing waiting. Ask your Social Media Manager for new drafts on the dashboard." },
    { title: "Approved", status: "approved", empty: "No approved posts yet." },
    { title: "Rejected", status: "rejected", empty: "No rejected posts." },
  ];

  return (
    <main className="app-shell">
      <AppHeader />
      <section className="app-main">
        <h1>Approval queue</h1>
        <p className="muted">
          Your agents propose. You decide. Every decision is recorded in the{" "}
          <Link href="/audit">audit log</Link>.
        </p>

        {groups.map((group) => {
          const items = rows.filter((r) => r.status === group.status);
          return (
            <div key={group.status} className="queue-group">
              <h2>
                {group.title} <span className="count">{items.length}</span>
              </h2>
              {items.length === 0 ? (
                <p className="muted">{group.empty}</p>
              ) : (
                items.map((r) => (
                  <ActionCard
                    key={r.id}
                    id={r.id}
                    platform={r.payload.platform}
                    text={r.payload.text}
                    status={r.status}
                    source={r.source}
                  />
                ))
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
}
