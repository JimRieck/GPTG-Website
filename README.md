# Green Pastures Technology Group — Website

Public marketing site with a contact form, plus a hidden admin area for reviewing leads.

## Stack

| Piece | Used for |
| --- | --- |
| Next.js 16 (App Router, TypeScript) | Site, forms (server actions), admin pages |
| Vercel | Hosting |
| Supabase | Leads database (Postgres) and admin sign-in (Supabase Auth) |
| Resend | Emails: lead notification to you, confirmation to the visitor |
| Google Geocoding API | "Verify address" button on each lead |
| Vitest | Unit tests |
| GitHub Actions | CI (typecheck, tests, build) and production deploy |

## Pages

- `/` — Information page
- `/contact` — Contact form (name, company, address, city, state, ZIP, email, phone, message)
- `/admin/login` — Admin sign-in (not linked anywhere on the site)
- `/admin/leads` — All leads, newest first, with a **Verify address** button per row

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
npm test                     # unit tests
npm run typecheck
npm run build
```

## One-time setup

### 1. Supabase
1. Create a project at supabase.com.
2. Open **SQL Editor** and run [`supabase/migrations/0001_create_leads.sql`](supabase/migrations/0001_create_leads.sql). (The deploy workflow also applies migrations automatically from now on.)
3. **Authentication → Providers → Email**: turn **off** "Allow new users to sign up" so nobody can create an account through the site.
4. **Authentication → Users → Add user**: create your admin user with your email and a strong password. Its email must match `ADMIN_EMAIL`.
5. Copy the URL, anon key and service role key from **Project Settings → API** into your env vars.

### 2. Resend
1. Create an account at resend.com and verify your sending domain (add the DNS records it gives you).
2. Create an API key. Set `EMAIL_FROM` to an address on that verified domain.

### 3. Google Geocoding
1. In Google Cloud, enable the **Geocoding API** and create an API key.
2. Restrict the key to the Geocoding API (and to your server IPs if you can).
3. Set `GOOGLE_GEOCODING_API_KEY`.

### 4. Vercel
1. Import this GitHub repository in Vercel and deploy once.
2. Add the environment variables from `.env.example` under **Project → Settings → Environment Variables** (Production and Preview).
3. Note the **Org ID** and **Project ID** (Settings → General) and create a token under Account Settings → Tokens.

### 5. GitHub
Add these under **Settings → Secrets and variables → Actions**:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN` (Supabase account → Access Tokens), `SUPABASE_PROJECT_REF` (the ID in your project URL), `SUPABASE_DB_PASSWORD`

Optionally create a `production` environment (Settings → Environments) to require approval before deploys.

## How the pipeline works

- **Pull requests and pushes:** `CI` runs typecheck, unit tests and a production build.
- **Push to `main`:** `Deploy` runs the same checks, applies any new Supabase migrations, then builds and deploys to Vercel production.

Vercel's own Git integration also creates preview deployments for pull requests. If you want the Git integration to stop auto-deploying `main` (so only the workflow deploys production), turn off **Production Branch** deployments in Vercel's Git settings.

## Notes on security

- The admin area is protected server-side on every page and every action (not just by hiding the link). Only the single address in `ADMIN_EMAIL` is accepted.
- `/admin` pages send `noindex` headers and are not linked from the site.
- Leads are stored with row level security enabled and no public policies. Only the server, using the service role key, can read or write them.
- The contact form has a honeypot field to deter basic spam bots.
