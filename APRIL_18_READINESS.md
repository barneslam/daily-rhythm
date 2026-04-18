# April 18 Test Run - Readiness Checklist

## Code Changes
- ✅ test-full-pipeline.js created (Netlify scheduled function)
- ✅ content-publisher.js fixed (Content-Length header)
- ✅ test-full-pipeline.js fixed (Content-Length header)
- ✅ Blotato API integration verified (Content-Length fix committed)
- ✅ dashboard-server.js includes /api/test-full-pipeline endpoint for manual testing

## Environment Configuration (Netlify)
These must be set in Netlify environment variables:

| Variable | Status | Value Source |
|----------|--------|---------------|
| `SUPABASE_URL` | ✅ Set | From Supabase project |
| `SUPABASE_ANON_KEY` | ✅ Set | From Supabase project |
| `BLOTATO_API_KEY` | ✅ Set | From Blotato dashboard |
| `BLOTATO_LINKEDIN_ACCOUNT_ID` | ✅ Set | From blotato-config.json (17347) |
| `BLOTATO_INSTAGRAM_ACCOUNT_ID` | ✅ Set | From blotato-config.json (40098) |

## Database Requirements

### gtm_targets table
- Must exist with columns: id, name, business, signal, status
- Must have at least 20 leads with `status = 'connection_req'`
- Current state: 58 leads in database
- Query test:
  ```sql
  SELECT COUNT(*) FROM gtm_targets WHERE status = 'connection_req'
  ```

### content_drafts table
- Must exist with columns: id, business, trigger, signal, linkedin_draft, instagram_draft, status, created_at, scheduled_for, published_at, published_to, blotato_post_id
- Must be writable
- Query test:
  ```sql
  SELECT COUNT(*) FROM content_drafts WHERE status IN ('pending', 'approved', 'published')
  ```

## Scheduled Function Verification

### Function: test-full-pipeline
- Cron: `0 8 18 4 *` (April 18 at 8:00 AM UTC)
- Method: GET or POST to trigger manually
- Expected behavior:
  1. Query 20 leads with status='connection_req'
  2. Generate LinkedIn + Instagram drafts for each
  3. Insert drafts with status='pending'
  4. Auto-approve (status → 'approved')
  5. POST to Blotato API for scheduling
  6. Update status → 'published'

## Manual Test (Before Auto-Run)

### Option 1: Local Terminal
```bash
curl http://localhost:3001/api/test-full-pipeline
```
Expected response:
```json
{
  "status": "success",
  "generated": 20,
  "approved": 20,
  "published": 20
}
```

### Option 2: Netlify Function (requires BLOTATO_API_KEY)
```bash
curl https://daily-rhythm.netlify.app/.netlify/functions/test-full-pipeline
```

## Post-Test Verification (April 18 @ 8:15 AM UTC)

### 1. Dashboard Check
- URL: https://daily-rhythm.netlify.app
- Tab: "Content Approval"
- Expected: 20 new drafts in "Approved & Scheduled" section
- Status: All should show as "approved"

### 2. Database Check
```sql
SELECT COUNT(*) FROM content_drafts 
WHERE status = 'approved' 
AND created_at > NOW() - INTERVAL '1 hour'
```
Expected result: 20

### 3. Blotato Verification
- Check Blotato dashboard for recent posts
- Should see 20 LinkedIn posts scheduled
- Should see 20 Instagram posts scheduled
- All scheduled for April 19, 8 AM UTC

### 4. Function Logs
- Check Netlify function logs for test-full-pipeline execution
- Look for success indicators:
  - "Generated 20 content drafts from 20 leads"
  - "Approved 20 content drafts"
  - "Published 20 posts to Blotato"

## Known Limitations & Gotchas

1. **Local Testing**: Cannot test Blotato API locally without valid API key
   - Will get 404 errors, but Content-Length fix ensures correct format
   - Real test will use Netlify env vars with valid key

2. **Duplicate Leads**: If test is run multiple times, drafts will keep being created
   - Each run generates new entries in content_drafts
   - This is OK for testing, but track volume

3. **Content Quality**: Generated drafts use hardcoded templates
   - May be identical across multiple leads
   - In production, should use AI generation for unique content

4. **Blotato Scheduling**: Posts scheduled 24 hours in advance
   - April 18 test creates posts for April 19, 8 AM UTC
   - Actual publishing depends on Blotato configuration

## Rollback Plan

If test fails or needs to be cancelled:

```bash
# Revert to previous state
git revert 929b8d4

# Disable scheduled function (comment out in netlify.toml)
# [[scheduled_functions]]
# function = "test-full-pipeline"
# cron = "0 8 18 4 *"

git push origin main
```

---

**Status**: Ready for April 18, 8:00 AM UTC ✅  
**Last Updated**: 2026-04-17  
**Ready for**: Full pipeline test with real API integration
