# Intrucive — Deployment Setup

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Copy your **Project URL** and **anon public key** from Project Settings → API

## 2. Configure credentials

Open `js/supabase-config.js` and replace:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

## 3. Deploy to Vercel via GitHub

1. Push the entire `DEPLOYABLES/` folder contents to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Framework preset: **Other**
4. Root directory: `/` (the repo root, which should be the DEPLOYABLES contents)
5. Click Deploy

## 4. Create your Super Admin account

1. Sign up at `/login.html`
2. In Supabase → Table Editor → `profiles` → find your row → set `role` to `super_admin`
3. Sign in again — you'll be redirected to `/superadmin.html`

## 5. Create your first Company

1. Sign in as super admin → Overlord Panel → Companies → Add Company
2. Copy the generated admin key
3. Share it with employees — they enter it during sign up to join the company

## Pages

| Path | Description |
|---|---|
| `/index.html` | Public landing page |
| `/login.html` | Sign in / Sign up |
| `/dashboard.html` | Learner dashboard |
| `/learn.html` | Lesson viewer |
| `/certificate.html` | Certificate verification |
| `/admin.html` | Company admin dashboard |
| `/superadmin.html` | Overlord / super admin panel |
