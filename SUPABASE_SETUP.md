# Supabase Integration Setup

Your Daily Rhythm GTM Engine is now ready to connect to Supabase. Follow these steps:

## Step 1: Create the Database Tables

1. Go to your Supabase project dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase-init.sql` (in this directory)
5. Paste into the SQL Editor
6. Click **Run** (or Cmd+Enter)

✅ You should see three tables created:
- `outreach_messages`
- `discovered_leads`
- `tracker`

## Step 2: Enable Row Level Security (RLS) - Optional

For production, you may want to enable RLS. For now, the anon key has write access.

## Step 3: Install Dependencies

```bash
cd /Users/b.lamoutlook.com
npm install
```

This installs:
- `@supabase/supabase-js` — Supabase client library
- `dotenv` — Environment variable loading
- `node-cron` — Task scheduler (already configured)

## Step 4: Verify Environment Variables

The `.env` file is already created with your credentials:
```
SUPABASE_URL=https://qiwdgyilhwkndqkgqruf.supabase.co
SUPABASE_ANON_KEY=[YOUR_KEY]
```

⚠️ **IMPORTANT:** Add `.env` to `.gitignore` (DO NOT commit API keys)

## Step 5: Start the Dashboard

```bash
cd /Users/b.lamoutlook.com/daily-rhythm
node dashboard-server.js
```

You should see:
```
✓ GTM Engine Dashboard running on http://localhost:3001
📊 Lead Discovery: Scheduled daily at 7:00 AM
```

## What Happens Next

### 7am Daily (Automatic)
- `lead-discovery.js` runs automatically
- Discovers 5-10 new qualified leads
- Stores in Supabase `discovered_leads` table
- Logs results to `logs/[date]-discovery.md`

### Dashboard Display
- `/api/discovered-leads` → Fetches from Supabase
- `/api/outreach` → Fetches from Supabase (once populated)
- All data persists in Supabase (not local JSON files)

### Manual Operations
- Send outreach messages (populate `outreach_messages` table)
- Track responses (update `send_date`, status)
- Generate follow-ups from unanswered leads

## Troubleshooting

**Error: "SUPABASE_ANON_KEY not found"**
- Make sure `.env` file exists in `/Users/b.lamoutlook.com/daily-rhythm/`
- Restart dashboard-server.js

**Error: "Table does not exist"**
- Run `supabase-init.sql` in Supabase SQL Editor
- Tables must be created before dashboard tries to use them

**Connection Issues**
- Verify Supabase URL is correct
- Verify Anon Key is valid
- Check internet connection

## Next Steps

1. ✅ Tables created in Supabase
2. ✅ Environment variables configured
3. ✅ Dashboard connected to Supabase
4. ⏳ Populate `outreach_messages` table (your 7 Week 1 messages)
5. ⏳ Start sending at 7am Tuesday April 15
6. ⏳ Monitor discovered leads daily at 7am

---

**Questions?** Check the logs directory for detailed activity records.
