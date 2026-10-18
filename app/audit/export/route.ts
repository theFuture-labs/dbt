import { createClient } from "../../../lib/supabase/server";
import { getCompanyId } from "../../../lib/company";

function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  // Stop spreadsheet programs from treating text as a formula.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Please sign in.", { status: 401 });

  const companyId = await getCompanyId(supabase, user.id);
  if (!companyId) return new Response("No company.", { status: 404 });

  const { data } = await supabase
    .from("audit_log")
    .select("id, created_at, actor_type, actor_id, event, entity_type, entity_id, details")
    .eq("company_id", companyId)
    .order("id", { ascending: true })
    .limit(10000);

  const header = ["id", "time_utc", "actor_type", "actor_id", "event", "entity_type", "entity_id", "details"];
  const lines = [header.join(",")];
  for (const r of data ?? []) {
    lines.push(
      [
        r.id,
        r.created_at,
        r.actor_type,
        r.actor_id,
        r.event,
        r.entity_type,
        r.entity_id,
        JSON.stringify(r.details ?? {}),
      ]
        .map(csvCell)
        .join(",")
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="dibiti-audit-log.csv"',
    },
  });
}
