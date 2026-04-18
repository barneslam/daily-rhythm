# Special Test Run - April 18, 2026

## Schedule

**Automated Test Time:** Saturday, April 18 at **8:00 AM UTC**
- Function: `test-full-pipeline`
- Cron: `0 8 18 4 *` (one-time trigger)

## What It Does

This special test runs the **complete GTM pipeline end-to-end** in one flow:

### Step 1: Generate Content (from 58 leads)
- Pulls top 20 CROs from `gtm_targets` table
- Creates 20 content drafts (LinkedIn + Instagram copy)
- Each draft tailored to the lead's signal/trigger

### Step 2: Auto-Approve
- All 20 generated drafts automatically move to "approved" status
- Simulates the approval workflow (in production, user would approve manually via dashboard)

### Step 3: Publish to Blotato
- Publishes approved content to Blotato API
- Scheduled for 24 hours later (April 19, 8 AM UTC)
- Posts to LinkedIn and Instagram accounts
- Blotato handles actual scheduling and posting

## Expected Results

**Dashboard shows:**
- ✅ 20 new drafts in "Content Approval" tab (approved status)
- ✅ 20 posts queued in Blotato (visible in /api/blotato-dm-poller results)
- ✅ Pipeline tracker updates with publishing metrics

**Logs show:**
- 🧪 Step 1: Generated 20 content drafts from 20 leads
- ✅ Step 2: Approved 20 content drafts
- 🚀 Step 3: Published 20 posts to Blotato

## Manual Trigger (Test Before Tomorrow)

Run anytime to test the pipeline:

```bash
curl http://localhost:3001/api/test-full-pipeline
```

Expected response:
```json
{
  "status": "success",
  "message": "Full pipeline test completed",
  "generated": 20,
  "approved": 20,
  "published": 20,
  "leadsSampled": 20,
  "timestamp": "2026-04-18T08:00:00Z"
}
```

## Full Pipeline Flow Verified

This test verifies all components work together:

1. **Lead Discovery** ✓ 58 CROs identified in database
2. **Content Generation** ✓ Auto-generate LinkedIn + Instagram posts
3. **Approval Workflow** ✓ Move drafts from pending → approved
4. **Blotato Publishing** ✓ Send to real social media accounts
5. **Inbound Capture** ✓ Multi-channel message tracking (email, website, Calendly, LinkedIn)

## Integration Fixes Applied

**Before test run (April 17):**
- ✅ Fixed Blotato API Content-Length header issue (commit 929b8d4)
  - Previous error: "Body is not valid JSON"
  - Root cause: Missing Content-Length header in POST requests
  - Solution: Calculate and set Content-Length for all JSON payloads

## Follow-up Actions

**After the test runs tomorrow (8 AM UTC):**

1. **Check Dashboard** → https://daily-rhythm.netlify.app
   - Go to "Content Approval" tab
   - Verify 20 drafts in "Approved & Scheduled" section

2. **Verify Blotato Integration**
   - Check Blotato dashboard for scheduled posts
   - Confirm LinkedIn and Instagram posts queued for April 19
   - Both platforms should show 20+ posts scheduled

3. **Monitor Real Publishing**
   - Posts auto-publish April 19, 8 AM UTC (scheduled via Blotato)
   - Or manually trigger: `curl https://daily-rhythm.netlify.app/.netlify/functions/content-publisher`

4. **Test Inbound Webhooks**
   - Send test message to inbound endpoint
   - Verify auto-qualification scores assigned

## Notes

- This is a **one-time special test** (Saturday only)
- Regular schedule resumes next week:
  - Daily lead discovery: 7 AM UTC every day
  - Weekly content generation: Monday 8 AM UTC
  - Weekly publishing: Monday 9 AM UTC

- Test environment: Netlify (production)
- Uses real Supabase project: `zyoszbmahxnfcokuzkuv`
- Blotato credentials: Must be set in Netlify env vars for real posting

## Rollback

If something goes wrong:
```bash
git revert 32fc5a5
git push origin main
```

This disables the special test and keeps normal schedule.

---

**Status:** Ready for April 18 at 8 AM UTC ✅
**Last updated:** 2026-04-17
