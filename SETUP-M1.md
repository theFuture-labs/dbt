# diBiti Milestone 1: setup steps

Do these in order. About 20 minutes. Replace `YOUR-SITE` with your Vercel address (for example `dibiti.vercel.app`, shown at the top of your Vercel project).

## A. Upload the new code
1. Unzip `dibiti-milestone1.zip`.
2. In your GitHub repo, upload everything inside, keeping the same folders. It adds new folders (`lib`, `supabase`, and more under `app`) and replaces a few files.
3. Do not upload `.env.example` values anywhere secret. It is only a template.

## B. Create the database tables (Supabase)
1. Open your Supabase project, then **SQL Editor**, then **New query**.
2. Open `supabase/001_init.sql` from the zip, copy everything, paste it in, and click **Run**.
3. You should see "Success. No rows returned". Under **Table Editor** you will now see `companies`, `memberships` and `company_profiles`.

## C. Create the Google sign-in key
1. Go to console.cloud.google.com, open your diBiti project.
2. Left menu: **APIs & Services**, then **Credentials**, then **Create credentials**, then **OAuth client ID**.
3. Application type: **Web application**. Name it `diBiti`.
4. Under **Authorized redirect URIs** add exactly:
   `https://pcxomkzbkxgpvebemwwj.supabase.co/auth/v1/callback`
5. Click **Create**. Copy the **Client ID** and **Client secret** (keep them private).
6. If Google asks you to configure the consent screen first: choose **External**, app name `diBiti`, your email for support and developer contact, and add your privacy policy link `https://YOUR-SITE/privacy`. Basic sign-in only (email and profile). While the app is in "Testing", add your own Google email under **Test users**.

## D. Turn on Google in Supabase
1. Supabase, then **Authentication**, then **Sign In / Providers** (or **Providers**), then **Google**.
2. Switch it on, paste the **Client ID** and **Client secret**, and save.
3. Then **Authentication**, then **URL Configuration**:
   - **Site URL:** `https://YOUR-SITE`
   - **Redirect URLs:** add `https://YOUR-SITE/**`

## E. Give Vercel the two Supabase values
1. Vercel, then your project, then **Settings**, then **Environment Variables**.
2. Add `NEXT_PUBLIC_SUPABASE_URL` = `https://pcxomkzbkxgpvebemwwj.supabase.co`
3. Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon key you sent me.
4. Choose all environments, save, then go to **Deployments** and **Redeploy** the latest one.

## F. Test it on your phone
1. Open `https://YOUR-SITE`, tap **Get started**, continue with Google.
2. Answer the four setup steps and tap **Finish setup**.
3. You should land on your dashboard showing your company profile. Try **Edit**, change something, save.
4. Sign out and sign in again. You should go straight to the dashboard.

## If something breaks
- Vercel build error: copy the red error text to me.
- Google says "redirect_uri_mismatch": the redirect URI in step C4 is not exactly right.
- Sign-in loops back to the login page: recheck step D3 and the two Vercel values in step E, then redeploy.
- Send me a screenshot of whatever you see and I'll fix it.
