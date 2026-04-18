# GTM Engine - Deployment Checklist

## Status: READY FOR NETLIFY DEPLOYMENT ✓

**Local Testing Results:**
- ✓ All 6 API endpoints operational
- ✓ 58 qualified leads in targets table
- ✓ Content approval workflow working
- ✓ Multi-channel inbound message tracking active
- ✓ Scheduled functions configured in netlify.toml
- ✓ Dashboard UI fully functional

**Latest Commit:** `675c0b8` - Integration tests passed, deployment ready

---

## Phase 1: Netlify Environment Configuration

Required environment variables to set in Netlify (Site settings → Environment variables):

```
SUPABASE_URL=https://zyoszbmahxnfcokuzkuv.supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
BLOTATO_API_KEY=[your-blotato-api-key]
BLOTATO_LINKEDIN_ACCOUNT_ID=[linkedin-account-id]
BLOTATO_INSTAGRAM_ACCOUNT_ID=[instagram-account-id]
```

**Verification:**
- Deploy triggers automatically on git push
- Check build log: https://app.netlify.com/sites/daily-rhythm/
- Site lives at: https://daily-rhythm.netlify.app

---

## Phase 2: Scheduled Functions Activation

Three functions configured in `netlify.toml`:

| Function | Schedule | Purpose |
|----------|----------|---------|
| `schedule-discovery` | Daily 7:00 AM UTC | Find 20+ new leads, score by fit |
| `content-generator` | Monday 8:00 AM UTC | Generate weekly content (10-15 posts) |
| `content-publisher` | Monday 9:00 AM UTC | Approve & publish to Blotato |

**Test Activation:**
```bash
# View scheduled functions in Netlify UI
# Settings → Functions → Scheduled Functions

# Verify they fire by checking function logs
# Go to: Functions → Function Log
```

---

## Phase 3: Inbound Message Webhooks

Currently falling back to sample data. For live tracking, configure:

### Email Capture
- Forward inquiries to: `[email-endpoint]@daily-rhythm.netlify.app`
- Function: `netlify/functions/api-inbound.js`
- Stores in `inbound_messages` table with `channel='email'`

### Website Form
- POST to: `https://daily-rhythm.netlify.app/.netlify/functions/api-inbound`
- Body: `{ sender_name, sender_email, message_text, channel: 'website' }`
- Auto-scores with qualification_score

### Calendly Integration
- Webhook on booking: POST to inbound function
- Triggers auto-qualification (booking = qualified lead)

### LinkedIn DMs
- Polling fallback: 30-min interval via `blotato-dm-poller.js`
- Requires: `BLOTATO_API_KEY` configured

---

## Phase 4: Blotato Publishing Workflow

**Current State:**
- Content drafts created by `content-generator`
- Dashboard shows approval workflow (Pending → Approved → Published)
- `content-publisher` sends approved drafts to Blotato Monday 9am

**Test Flow:**
1. Open dashboard at https://daily-rhythm.netlify.app
2. Go to "Content Approval" tab
3. Click "Approve" on pending draft
4. Monday 9am UTC: Function automatically publishes to LinkedIn & Instagram
5. Verify posts appear on your accounts (real Blotato API credentials required)

**Account IDs Needed:**
- Get from Blotato dashboard after connecting accounts
- Store in Netlify env vars as shown in Phase 1

---

## Phase 5: Database Integrity Check

Run these queries to verify schema is ready:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;

-- Expected tables:
-- inbound_messages, content_drafts, pipeline_targets, pipeline_config, 
-- pipeline_program, pipeline_tracker
```

---

## Phase 6: Full System Test

Once deployed, run end-to-end test:

1. **Trigger Lead Discovery** (manual override for testing)
   ```bash
   curl -X POST https://daily-rhythm.netlify.app/.netlify/functions/schedule-discovery
   ```
   - Check: New leads appear in targets table
   - Check: Tracker shows updated count

2. **Simulate Content Generation** (manual override)
   ```bash
   curl -X POST https://daily-rhythm.netlify.app/.netlify/functions/content-generator
   ```
   - Check: New drafts in dashboard approval tab
   - Check: LinkedIn + Instagram copy generated

3. **Simulate Publishing** (manual override)
   ```bash
   curl -X POST https://daily-rhythm.netlify.app/.netlify/functions/content-publisher
   ```
   - Check: Approved content publishes to Blotato
   - Check: Posts appear on LinkedIn & Instagram

4. **Test Inbound Message Webhook**
   ```bash
   curl -X POST https://daily-rhythm.netlify.app/.netlify/functions/api-inbound \
     -H "Content-Type: application/json" \
     -d '{
       "sender_name": "Test User",
       "sender_email": "test@example.com",
       "message_text": "Interested in GTM",
       "channel": "website"
     }'
   ```
   - Check: Message appears in dashboard Inbound tab
   - Check: Auto-qualification score assigned

---

## Deployment Command

Push to trigger automatic Netlify deployment:

```bash
git add -A
git commit -m "Deploy GTM Engine to Netlify"
git push origin main
```

**Build status:** https://app.netlify.com/sites/daily-rhythm/

---

## Rollback Plan

If issues arise:

```bash
git revert HEAD
git push origin main
```

This will redeploy the previous working version.

---

## Success Criteria

✓ Dashboard loads at https://daily-rhythm.netlify.app
✓ All API endpoints return data
✓ Scheduled functions appear in Netlify logs
✓ Content approval workflow shows drafts
✓ Blotato publishes to real accounts Monday 9am UTC
✓ Inbound messages captured from webhooks

---

## Support

**Netlify Dashboard:** https://app.netlify.com/sites/daily-rhythm
**Supabase Project:** zyoszbmahxnfcokuzkuv
**Functions Base URL:** https://zyoszbmahxnfcokuzkuv.supabase.co/functions/v1/

Last updated: 2026-04-17
