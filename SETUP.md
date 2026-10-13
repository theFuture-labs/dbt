# DBT Milestone 0: Setup Checklist

Do these in order. Each is free. Use one email you control (e.g. the one you'll use for DBT) for all of them.

## 1. Name and domain (today)
- Pick the name. DBT is a working name, so check it isn't taken (search it + "AI").
- Buy a domain (Namecheap, Porkbun, or Google Domains successor). A `.com` is best.
- Create a business email like `hello@yourdomain.com`. Meta and Google both look for a real contact.

## 2. GitHub (stores the code)
- Sign up at github.com.
- Create a **private** repository called `dbt`.
- Tell me when it exists. I'll show you the simplest way to upload the project.

## 3. Vercel (puts the site online)
- Sign up at vercel.com **with your GitHub account**.
- Click "Add New Project" and pick the `dbt` repo. Vercel builds and publishes it automatically.
- Add your domain under Project, then Settings, then Domains.
- Result: your privacy policy lives at `https://yourdomain.com/privacy`. Meta and Google both require this.

## 4. Fill in the privacy page placeholders
In `app/privacy/page.tsx`, replace `[Your legal company name]` and `[privacy@yourdomain.com]`. Send me the real values and I'll do it. Ideally a lawyer reviews the text before App Review.

## 5. Meta (starts the review clock)
- Make sure DBT has an **Instagram Business or Creator account** linked to a **Facebook Page**.
- Go to developers.facebook.com and register as a developer.
- Create a **Business Portfolio** at business.facebook.com.
- Create an app (type: Business). Add your privacy policy URL and app icon.
- Start Business Verification in the Business Portfolio settings (needs company documents).
- Add yourself as admin, and later, pilots as testers.

## 6. Google
- Go to console.cloud.google.com and create a project called DBT.
- Set up the OAuth consent screen. Use only basic sign-in scopes for now.
- Add your domain and privacy policy URL.

## 7. Supabase (database and login), needed for Milestone 1
- Sign up at supabase.com and create a project. Choose the region closest to your users.
- Save the database password somewhere safe.

## 8. Paystack, needed for Milestone 6
- Sign up at paystack.com and begin business verification early, since it can take days.

## What to send me when done
- Your chosen name and domain
- GitHub repo created (yes/no)
- Anything that confused you or blocked you
