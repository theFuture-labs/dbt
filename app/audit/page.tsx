import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { getCompanyId } from "../../lib/company";
import AppHeader from "../components/app-header";

export const metadata = { title: "Audit log | diBiti" };

type Entry = {
  id: number;
  actor_type: "user" | "agent" | "system";
  actor_id: string | null;
  event: string;
  details: Record<string, unknown>;
  created_at: string;
};

const EVENT_LABEL: Record<string, string> = {
  "run.completed": "Finished writing drafts",
  "action.proposed": "Proposed a post",
  "action.approved": "Approved a post",
  "action.rejected": "Rejected a post",
  "action.edited": "Edited a post",
};

function actor(e: Entry): string {
  if (e.actor_type === "agent") return "Social Media Manager";
  if (e.actor_type === "user") return "You or a teammate";
  return "diBiti";
}

function summary(e: Entry): string {
  const d = e.details ?? {};
  const parts: string[] = [];
  if (typeof d.platform === "string") parts.push(d.platform === "instagram" ? "Instagram" : "Facebook");
  if (typeof d.proposed === "number") parts.push(`${d.proposed} drafts`);
  if (d.source === "demo") parts.push("sample draft");
  if (d.needs_reapproval === true) parts.push("needs approval again");
  return parts.join(", ");
}

export default async function Audit() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) redirect("/onboarding");

  const { data } = await supabase
    .from("audit_log")
    .select("id, actor_type, actor_id, event, details, created_at")
    .eq("company_id", companyId)
    .order("id", { ascending: false })
    .limit(100);

  const entries = (data ?? []) as Entry[];

  return (
    <main className="app-shell">
      <AppHeader />
      <section className="app-main">
        <h1>Audit log</h1>
        <p className="muted">
          A permanent record of everything your agents proposed and everything
          you decided. Times are in UTC.
        </p>
        <p>
          <a className="btn btn-ghost btn-small" href="/audit/export">
            Download as CSV
          </a>
        </p>

        {entries.length === 0 ? (
          <p className="muted">Nothing here yet. Activity appears as soon as an agent does something.</p>
        ) : (
          <ul className="audit-list">
            {entries.map((e) => (
              <li key={e.id}>
                <span className="audit-time">
                  {new Date(e.created_at).toISOString().slice(0, 16).replace("T", " ")}
                </span>
                <span className="audit-what">
                  <strong>{EVENT_LABEL[e.event] ?? e.event}</strong>
                  {summary(e) ? <span className="muted"> ({summary(e)})</span> : null}
                  <span className="fine audit-actor">{actor(e)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
