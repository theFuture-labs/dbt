import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getCompanyId } from "../../lib/company";
import type { Plan } from "../../lib/agents/smm";
import AppHeader from "../components/app-header";
import { CreatePlanButton, DraftFromPlanButton, PlanDecision } from "./plan-controls";

export const metadata = { title: "Content plan | diBiti" };
// Writing a plan or posts with the AI can take a little while.
export const maxDuration = 60;

const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", facebook: "Facebook" };

export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) redirect("/onboarding");

  const { data: planRow } = await supabase
    .from("proposed_actions")
    .select("id, status, source, payload")
    .eq("company_id", companyId)
    .eq("type", "content_plan")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = planRow ? (planRow.payload as Plan) : null;

  // Which planned days already have a draft.
  const draftedDays = new Set<number>();
  if (planRow) {
    const { data: posts } = await supabase
      .from("proposed_actions")
      .select("payload")
      .eq("plan_id", planRow.id)
      .neq("status", "rejected");
    for (const p of posts ?? []) draftedDays.add(Number((p.payload as { day?: number }).day));
  }
  const remaining = plan ? plan.slots.filter((s) => !draftedDays.has(s.day)).length : 0;

  return (
    <main className="app-shell">
      <AppHeader />
      <section className="app-main">
        <h1>Content plan</h1>
        <p className="muted">
          Your Social Media Manager proposes a 30-day strategy and calendar. You approve it, then it
          drafts the posts, and you approve each post in the <Link href="/queue">approval queue</Link>.
        </p>

        {!planRow || planRow.status === "rejected" ? (
          <div className="panel">
            <h2>{planRow ? "That plan was rejected" : "No plan yet"}</h2>
            <p className="muted">
              {planRow
                ? "Ask for a new one and it will start fresh from your profile."
                : "Create a 30-day plan from your company profile."}
            </p>
            <CreatePlanButton label={planRow ? "Create a new plan" : "Create my 30-day plan"} />
          </div>
        ) : plan ? (
          <>
            <div className="panel">
              <div className="post-meta">
                <span className="badge">{planRow.status === "approved" ? "Approved" : "Waiting for you"}</span>
                {planRow.source === "demo" ? <span className="badge badge-dim">Sample plan</span> : null}
              </div>
              <h2>Strategy</h2>
              <p className="post-text">{plan.summary}</p>
              {plan.pillars.length > 0 ? (
                <p className="muted">
                  <strong>Themes:</strong> {plan.pillars.join(", ")}
                </p>
              ) : null}
              {plan.cadence ? (
                <p className="muted">
                  <strong>Rhythm:</strong> {plan.cadence}
                </p>
              ) : null}
              {planRow.status === "pending" ? <PlanDecision id={planRow.id} /> : null}
              {planRow.status === "approved" ? <DraftFromPlanButton remaining={remaining} /> : null}
            </div>

            <div className="panel">
              <h2>Calendar</h2>
              <p className="muted">Day 1 is the day you start posting.</p>
              <ul className="audit-list">
                {plan.slots.map((s, i) => (
                  <li key={`${s.day}-${i}`}>
                    <span className="audit-time">
                      Day {s.day}, {PLATFORM_LABEL[s.platform] ?? s.platform}
                    </span>
                    <span className="audit-what">
                      <strong>{s.topic}</strong>
                      <span className="fine audit-actor">
                        {s.format}
                        {planRow.status === "approved"
                          ? draftedDays.has(s.day)
                            ? ", drafted"
                            : ", not drafted yet"
                          : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {planRow.status === "approved" ? (
              <p className="fine">Editing or replacing an approved plan arrives in a later update.</p>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
