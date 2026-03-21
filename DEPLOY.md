# Night Vibe Workshop — Deployment Guide

## 3-Step Deploy to Vercel

### Step 1: Push to GitHub
```bash
cd night-vibe-workshop
gh repo create night-vibe-workshop --private --source=. --push
```
Or create a repo on github.com and push manually:
```bash
git remote add origin https://github.com/YOUR_USERNAME/night-vibe-workshop.git
git push -u origin master
```

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. Add these Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ljvqqeoxqvfxhbjifgpa.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your anon key from .env.local) |
| `SUPABASE_SERVICE_ROLE_KEY` | (get from Supabase Dashboard → Settings → API → service_role key) |
| `ADMIN_PASSWORD` | `nightvibe2026` (change this to something secure) |

4. Click Deploy

### Step 3: Set Up Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR-DOMAIN.vercel.app/api/webhook/stripe`
3. Select event: `checkout.session.completed`
4. Save

## Important: Get Your Service Role Key
1. Go to https://supabase.com/dashboard/project/ljvqqeoxqvfxhbjifgpa/settings/api
2. Copy the `service_role` key (the secret one, NOT the anon key)
3. Add it as `SUPABASE_SERVICE_ROLE_KEY` in Vercel

## Pages
- `/` — Landing page (public)
- `/admin` — Admin panel (password: nightvibe2026)

## Admin Features
- View all events with seat counts
- Manually adjust sold count (+/-)
- Toggle featured event (shown on landing page)
- Change event status (draft → published → sold_out)
- Create new events with tickets
- View waitlist signups

## How Seat Tracking Works
1. Stripe webhook fires on each purchase
2. API matches payment link to event ticket
3. sold_count increments automatically
4. Landing page polls every 30 seconds for live updates
5. Auto-marks sold_out when capacity is reached
