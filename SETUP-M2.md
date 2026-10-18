# diBiti Milestone 2: setup steps

About 10 minutes. No new accounts or keys are needed to test.

## A. Upload the new code
1. Unzip `dibiti-milestone2.zip`.
2. Upload everything to your GitHub repo, keeping the same folders. It adds new folders (`app/queue`, `app/audit`, `app/components`, `lib/agents`) and replaces a few files (`app/dashboard/page.tsx`, `middleware.ts`, `app/globals.css`).
3. Vercel redeploys by itself.

## B. Add the new database pieces (Supabase)
1. Supabase, then **SQL Editor**, then **New query**.
2. Open `supabase/002_agents.sql` from the zip, copy everything, paste, and click **Run**.
3. You should see "Success. No rows returned". Run it only once. (If you ran it twice by mistake, it is safe.)

## C. Test it on your phone
1. Open your site, sign in, and go to the **Dashboard**.
2. Tap **Draft posts**. After a few seconds you'll see "5 sample drafts are waiting for your approval".
3. Open the **Approval queue**. Try each of these:
   - **Approve** one post. It moves to "Approved".
   - **Reject** one. It moves to "Rejected".
   - **Edit** an approved post and save. It should jump back to "Waiting for you", because an edit removes the approval.
4. Open the **Audit log**. You should see a line for every step above, in order.
5. Tap **Download as CSV** and check the file opens.

The drafts are marked **Sample draft** because no AI key is added yet. That is expected.

## D. Later: switch on the real AI (only when your API billing works)
1. In Vercel, Settings, then Environment Variables, add `ANTHROPIC_API_KEY` with your key. Do **not** put `PUBLIC` in the name.
2. Redeploy. New drafts will then be written by Claude from your company profile, and they will no longer say "Sample draft".

## If something breaks
- Vercel build error: copy the red text to me.
- "Could not save" when you tap Draft posts: step B was probably skipped or failed. Run `002_agents.sql` again and check for a red error.
- Send a screenshot of anything odd.
