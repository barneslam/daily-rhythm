# Content Curation System — Activation Guide

**Status:** ✅ System complete and ready to run

## What's Running

- **Curation Daemon**: Executes daily at 9am ET (Mon-Fri)
- **Content Pieces**: 5 pieces (Mon-Fri) with graphics + CTAs + website URLs
- **Lead Pipeline**: Incoming DMs auto-create leads in dashboard
- **Engagement Tracking**: Real-time metrics per piece
- **Duration**: 12 months (April 2026 - March 2027, 20 days/month)

## Quick Start (5 minutes)

### 1. Start the Daemon
```bash
cd /Users/b.lamoutlook.com/daily-rhythm

# Verify dependencies
npm install

# Start the daemon (runs forever)
npm run curation:start

# Output should show:
# 🚀 Content Curation Daemon starting...
# ✅ Daemon active. Scheduled tasks...
```

The daemon is now running 24/7, executing content at 9am ET Mon-Fri.

### 2. Test Execution (Optional)
In a separate terminal:
```bash
# Manually trigger curation
npm run curation:test

# Get monthly report
npm run curation:report

# Simulate an incoming DM
node curation-skill.js dm '{"sender_name":"Sarah","sender_email":"sarah@company.com","message_text":"SEQUENCE"}'
```

### 3. Monitor in Real-Time
```bash
# Watch the logs
tail -f logs/curation-*.log

# Or check Supabase directly:
# SELECT * FROM content_pieces ORDER BY created_at DESC;
# SELECT * FROM content_engagement ORDER BY published_at DESC;
```

## Integration Checklist

### ✅ Completed
- [x] Curation skill (curation-skill.js)
- [x] Daemon scheduler (curation-daemon.js)
- [x] 5 content pieces + graphics (drafts + graphics directories)
- [x] Website URLs in all CTAs
- [x] Database schema (content_pieces, content_engagement)
- [x] DM handler (functions/dm-handler.js)
- [x] Package.json scripts

### ⏳ Still Needed

#### 1. Register DM Webhook with Blotato
```bash
# Blotato webhook endpoint:
POST https://daily-lead-gen-track.netlify.app/api/dm-handler

# Webhook payload template:
{
  "sender_name": "John Doe",
  "sender_email": "john@company.com",
  "message_text": "SEQUENCE",
  "source_content_id": "monday-sequencing",
  "piece_title": "The Sequencing Problem"
}

# Contact Blotato support to register this webhook
# OR test locally: curl -X POST http://localhost:3001/api/dm-handler -d '{...}'
```

#### 2. Verify Content Pieces in Supabase
Check that all 5 pieces are being created:
```sql
SELECT title, platform, status, created_at 
FROM content_pieces 
ORDER BY created_at DESC LIMIT 5;

-- Expected: 5 rows (Mon-Fri pieces)
-- Status should be: 'scheduled'
```

#### 3. Test Lead Creation from DM
When a DM arrives:
```sql
SELECT * FROM gtm_targets 
WHERE source = 'dm' 
ORDER BY created_at DESC LIMIT 10;

-- Expected: New lead appears within 1 minute of DM
```

## Troubleshooting

### Daemon not running?
```bash
# Check if already running
ps aux | grep curation

# Kill if stuck
kill -9 <PID>

# Restart
npm run curation:start
```

### Content not being created?
```bash
# Verify drafts exist
ls -la drafts/week-content-*.md

# Test manually
npm run curation:test

# Check logs
tail -f logs/curation-*.log
```

### DMs not creating leads?
```bash
# Test the handler manually
curl -X POST http://localhost:3001/api/dm-handler \
  -H "Content-Type: application/json" \
  -d '{"sender_name":"Test","message_text":"SEQUENCE"}'

# Check that endpoint is registered
echo "Expected endpoint: https://gtm-engine-dashboard.netlify.app/api/dm-handler"
```

## Daily Operations

### Morning (7:30am ET)
- Daemon prepares content for 9am launch
- Check logs: `tail -f logs/curation-*.log`

### Midday (12pm ET)
- Monitor engagement in Supabase
- Query: `SELECT * FROM content_engagement WHERE DATE(published_at) = TODAY();`

### Evening (6pm ET)
- Review any incoming DMs in `gtm_targets` table
- Respond to lead inquiries

### Weekly (Monday 8am ET)
- Automatic engagement report generated
- Check: `npm run curation:report`

## Monthly Milestones

**Apr 2026:** Baseline month — establish content rhythm & DM baseline
**May 2026:** First full month of engagement metrics
**Jun 2026:** Optimize content themes based on top performers
**Jul-Nov 2026:** Sustained curation + lead generation
**Dec 2026:** Year-end review, plan 2027 content strategy

## Stopping the Daemon

```bash
# Graceful shutdown
Ctrl+C in the terminal running daemon

# Verify stopped
ps aux | grep curation
# Should show no process
```

## Support

- **Logs location:** `daily-rhythm/logs/curation-YYYY-MM-DD.log`
- **Issue: Skill fails?** Check Supabase credentials in `.env`
- **Issue: DM webhook?** Verify Blotato webhook registration
- **Issue: Daemon hangs?** Restart with `npm run curation:start`

---

**Activation time:** < 5 minutes
**First content launch:** Monday, April 21 at 9am ET
**Status:** Ready to go 🚀
