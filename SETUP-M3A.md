# diBiti: content plan update, setup steps

About 10 minutes. No new accounts or keys needed. If you have not yet tested Milestone 2, this update includes it, so just do the steps below and test everything together.

## A. Upload the new code
1. Unzip `dibiti-content-plan.zip`.
2. Upload everything to your GitHub repo, keeping the same folders. New: `app/plan`, `supabase/003_plans.sql`. Updated: several existing files.
3. Vercel redeploys by itself.

## B. Update the database (Supabase)
Run these in **SQL Editor, New query**, one at a time, in order. Skip any you already ran.
1. `supabase/002_agents.sql` (only if you never ran it)
2. `supabase/003_plans.sql`

You should see "Success. No rows returned" each time.

## C. Test it on your phone
1. Open **Content plan** in the menu. Tap **Create my 30-day plan**.
2. You'll see a strategy summary, themes, rhythm, and a calendar of planned posts. (Without an AI key it is labelled **Sample plan**.)
3. Tap **Approve plan**. The calendar now shows "not drafted yet" on each slot.
4. Tap **Draft the next 5 posts**. Open the **Approval queue** and approve, edit or reject them.
5. Back on the plan page, those slots now say "drafted". Tap Draft again to get the next 5.
6. Open the **Audit log**. You should see the plan being proposed and approved, then each post, in order.

Also try: reject a plan and create a new one, and check you cannot draft posts before the plan is approved.

## D. Later: the real AI
When your API billing works, add `ANTHROPIC_API_KEY` in Vercel (no `PUBLIC` in the name), then redeploy. Plans and posts will then be written by Claude from your company profile.

## If something breaks
- Vercel build error: copy the red text to me.
- "Could not be saved": step B was probably skipped. Run `003_plans.sql` again and check for a red error.
- Send a screenshot of anything odd.
