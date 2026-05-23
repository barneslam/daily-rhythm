# RIN GTM Engine Setup Guide

**Status**: Configuration complete ✅  
**Created**: 2026-05-04  
**Next Step**: Activate curation daemon

---

## Overview

Your RIN publishing pipeline is configured to publish 6x/week (Mon-Sat at 9am EST) to:
- **Facebook**: RIN Tow Driver Network Canada (Page ID: 61589010212907)
- **Instagram**: @roadside_intelligence

Content flows: Generate → Draft (Supabase) → Review → Publish (Blotato)

---

## Architecture

```
Daily Rhythm System (config-rin.json)
          ↓
Claude AI Content Generation (Sonnet 4)
          ↓
Supabase gtm_drafts table (status: pending_approval)
          ↓
Manual Review + Approval (you)
          ↓
Blotato Publishing API
          ↓
Facebook + Instagram (simultaneous)
```

---

## Setup Steps (Complete These)

### 1. Verify Blotato Account Linking

You're using the same API key (`$BLOTATO_API_KEY`). Confirm both accounts are linked in Blotato:

```bash
# Check Blotato connected accounts
curl -X GET "https://api.blotato.com/v1/accounts" \
  -H "Authorization: Bearer $BLOTATO_API_KEY"
```

Look for:
- `platform: facebook` | `page_id: 61589010212907`
- `platform: instagram` | `handle: roadside_intelligence`

If either is missing, link manually at **blotato.com → Settings → Connected Accounts**.

---

### 2. Create RIN Drafts Directory

```bash
mkdir -p /Users/b.lamoutlook.com/daily-rhythm/drafts/rin
```

Drafts will follow naming: `carousel-rin-YYYY-MM-DD.md`

---

### 3. Start the RIN Curation Daemon

```bash
# From daily-rhythm directory
node curation-daemon.js --config config-rin.json --brand RIN
```

Or add to your cron (9am EST):
```bash
# 9:00 AM EST = 2:00 PM UTC (summer) or 1:00 PM UTC (winter)
# Using 13:00 UTC to cover both
0 13 * * * cd /Users/b.lamoutlook.com/daily-rhythm && node curation-daemon.js --config config-rin.json --brand RIN
```

---

### 4. Test the Publish Flow

**Step 1**: Generate a test draft manually
```bash
cat > /Users/b.lamoutlook.com/daily-rhythm/drafts/rin/test-draft.md << 'EOF'
---
date: 2026-05-12
type: carousel
channel: facebook,instagram
status: pending_approval
---

# Test: RIN Dispatch Intelligence

## Slide 1
Smart matching saves 2 hours/day on dispatch.

Real operators. Real results.

Join the RIN network.

drive.roadside.ai
EOF
```

**Step 2**: Insert into Supabase manually to test publishing:
```bash
curl -X POST "https://YOUR_SUPABASE_URL/rest/v1/gtm_drafts" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "draft_date": "2026-05-12",
    "draft_type": "carousel",
    "channel": "facebook,instagram",
    "title": "Test: RIN Dispatch Intelligence",
    "content": "Smart matching saves 2 hours/day...",
    "status": "approved"
  }'
```

**Step 3**: Publish to Blotato:
```bash
node publish-drafts.js --brand RIN --date 2026-05-12
```

Monitor: Check RIN Facebook + Instagram for the test post.

---

### 5. Daily Workflow (Going Forward)

**Morning (6:57 AM EST)**:
- Daemon auto-generates draft based on day's topic
- Draft appears in Supabase as `status: pending_approval`

**Mid-morning (8:30 AM EST)**:
- You review draft in Supabase dashboard (or via read-drafts.js)
- Approve or edit

**9:00 AM EST**:
- Auto-publish to Facebook + Instagram
- Monitor for errors

**End of day**:
- Log results (impressions, engagement, if tracking)

---

## Monitoring & Debugging

### Check pending drafts
```bash
node count-drafts.js
```

### View all RIN drafts
```bash
ls -la /Users/b.lamoutlook.com/daily-rhythm/drafts/rin/
```

### Check Blotato publish status
```bash
curl -X GET "https://api.blotato.com/v1/posts?status=published&limit=5" \
  -H "Authorization: Bearer $BLOTATO_API_KEY" | jq '.[] | select(.account.platform=="facebook" or .account.platform=="instagram")'
```

### View Supabase drafts directly
```bash
curl -X GET "https://YOUR_SUPABASE_URL/rest/v1/gtm_drafts?draft_date=2026-05-12&order=draft_date.desc" \
  -H "apikey: $SUPABASE_ANON_KEY" | jq '.'
```

---

## Content Pillars (Daily Topics)

| Day | Pillar | Example Topic |
|-----|--------|---------------|
| **Mon** | Dispatch Intelligence | How smart matching saves 2 hours/day on dispatch |
| **Tue** | Driver Story | Why independent operators choose RIN |
| **Wed** | Operational Edge | Scale your fleet without hiring more dispatchers |
| **Thu** | Dispatch Intelligence | Real-time optimization during peak hours |
| **Fri** | Operational Edge | Eliminate double-bookings and communication chaos |
| **Sat** | Community | Operator wins: case study or peer success |

---

## Account Details (Reference)

**Facebook**
- Page: RIN Tow Driver Network Canada
- URL: https://www.facebook.com/profile.php?id=61589010212907
- Page ID: `61589010212907`
- Followers: 3 (seed phase)

**Instagram**
- Handle: @roadside_intelligence
- URL: https://www.instagram.com/roadside_intelligence/
- Posts: 0 (new account)
- Followers: 3 (seed phase)

**CTA**: drive.roadside.ai (or drive-my-own.notify.app for SMS signup)

---

## Environment Variables Required

Ensure these are in your `.env`:
```bash
BLOTATO_API_KEY=your_key_here
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Draft not generating** | Check daemon logs: `node curation-daemon.js --config config-rin.json --debug` |
| **Blotato auth error** | Verify `$BLOTATO_API_KEY` is set and valid |
| **Instagram not publishing** | Check if account is linked as Business Account in Blotato (not Creator Account) |
| **Supabase insert error** | Verify RLS policies allow inserts on `gtm_drafts` table |
| **No posts appearing** | Check RIN account timezones — posts may be scheduled for future, not immediate |

---

## Next: First Week Content (May 12-17)

Pre-generate 6 carousel drafts for the first week:

```bash
# Create week 1 content
for date in 2026-05-12 2026-05-13 2026-05-14 2026-05-15 2026-05-16 2026-05-17; do
  echo "Creating carousel-rin-${date}.md..."
  touch /Users/b.lamoutlook.com/daily-rhythm/drafts/rin/carousel-rin-${date}.md
done
```

Then populate each with content (dispatch intelligence, driver stories, operational wins).

---

## Success Metrics (Week 1)

- ✅ 6 posts published (Mon-Sat)
- ✅ 0 publish errors
- ✅ Audience grows (from 3 to 10+ followers)
- ✅ Engagement (impressions, clicks, profile visits)

---

**Questions?** Check curation-daemon.js or message me.

---

*Setup completed: 2026-05-04*  
*Ready to activate: ✅*
