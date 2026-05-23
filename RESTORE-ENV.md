# How to Restore .env (IMPORTANT!)

## The Problem
The `.env` file is in `.gitignore` (for security — secrets shouldn't be committed).
When you do a fresh checkout or the file is accidentally deleted, it disappears.

## The Solution (One-Time Setup)

### Step 1: Create .env with Netlify Credentials

Run this command in your terminal:

```bash
cd /Users/b.lamoutlook.com/daily-rhythm

cat > .env << 'EOF'
SUPABASE_URL=https://qiwdgyilhwkndqkgqruf.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpd2RneWlsaHdrbmRxa2dxcnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwOTc4NDcsImV4cCI6MjA5MTY3Mzg0N30.bEhiitzcDMOpViFFtBhfbUKcHVDah8t7DvsNlTxaOEk
EOF

cat .env  # verify it worked
```

### Step 2: Start the Dashboard

```bash
npm run dev
# Dashboard runs on http://localhost:3001
```

### Step 3: Verify the Daily Rhythm

```bash
curl http://localhost:3001/api/targets | head
# Should return lead data from Supabase
```

---

## If .env Disappears Again

**Don't panic.** Just:
1. Run the command above again
2. Everything continues working (Netlify scheduled functions don't need local .env)

---

## Important Notes

⚠️ **NEVER commit .env to git** — it contains secrets  
⚠️ **NEVER paste credentials in chat** — they're in history now  
✅ **Safe to store in Netlify** — they're already there  
✅ **Safe to store in this doc** — it's local-only  

---

## What's Configured

| Service | Variable | Status |
|---------|----------|--------|
| Supabase | `SUPABASE_URL` | ✅ Configured |
| Supabase Auth | `SUPABASE_ANON_KEY` | ✅ Configured |
| Apollo Lead Discovery | `APOLLO_API_KEY` | ✅ On Netlify only |
| Blotato Publishing | `BLOTATO_API_KEY` | ✅ On Netlify only |
| Anthropic Content Gen | `ANTHROPIC_API_KEY` | ✅ On Netlify only |

**Local .env only needs:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Netlify has all of them** (scheduled functions work without local .env)

---

## Testing

Once .env is created:

```bash
# Test local dev
npm run dev &
sleep 2
curl http://localhost:3001/api/config

# Kill server
killall node
```

If you see JSON output, ✅ everything works!
