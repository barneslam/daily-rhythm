# Content Curation Scheduler

## Automated Execution

**Schedule:** Mon-Fri, 9am ET, 20 days/month (April 2026 - March 2027)

### Setup Instructions

Run this cron job to execute curation daily:

```bash
# Install node-cron (already in package.json)
npm install

# Start daemon that runs curation at 9am ET every weekday
node -e "
const cron = require('node-cron');
const { curate } = require('./curation-skill.js');

// Every weekday at 9am ET
cron.schedule('0 9 * * 1-5', () => {
  console.log('[CURATION] Running at 9am ET...');
  curate();
}, {
  timezone: 'America/New_York'
});

console.log('✓ Curation scheduler started. Running Mon-Fri 9am ET');
"
```

Or add to `package.json`:

```json
{
  "scripts": {
    "curation:start": "node curation-daemon.js",
    "curation:test": "node curation-skill.js curate",
    "curation:report": "node curation-skill.js report"
  }
}
```

### Manual Execution

Test the curation skill anytime:

```bash
# Generate & schedule today's content
node curation-skill.js curate

# Get monthly engagement report
node curation-skill.js report

# Simulate incoming DM
node curation-skill.js dm '{"sender_name":"John","sender_email":"john@example.com","message_text":"SEQUENCE","source_content_id":"monday-piece"}'
```

## Monitoring

Check execution in Supabase:

```sql
-- Recent content pieces
SELECT title, platform, status, scheduled_time 
FROM content_pieces 
ORDER BY created_at DESC LIMIT 10;

-- Engagement metrics
SELECT platform, SUM(engagement_count) as total_engagement, COUNT(*) as pieces
FROM content_engagement
WHERE published_at >= NOW() - INTERVAL '30 days'
GROUP BY platform;

-- Recent leads from DM
SELECT name, email, interested_in, created_at
FROM gtm_targets
WHERE source = 'dm'
ORDER BY created_at DESC LIMIT 10;
```

## Fallback: Manual Publishing

If cron fails:

```bash
# Manually curate for the week
node curation-skill.js curate
# Then upload graphics via Blotato manually
```

## Integration Checklist

- [x] Content drafts created (Mon-Fri in /drafts)
- [x] SVG graphics ready (/graphics directory)
- [x] Curation skill built (curation-skill.js)
- [x] Database schema created (content_pieces, content_engagement)
- [ ] Cron job configured (see setup above)
- [ ] DM webhook endpoint registered (Blotato → /api/dm-handler)
- [ ] Monthly report scheduled (email every 1st of month)
- [ ] Engagement dashboard built (shows content ROI)
