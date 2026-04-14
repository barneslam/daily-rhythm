# Weekly Content Curator Setup

Your automated content generation and publishing system is ready. Here's how to activate it.

## What It Does

- **Every Sunday at 10 PM EST** — Automatically generates 5 days of strategic LinkedIn + Instagram content
- **Mon-Fri at 9 AM EST** — Posts go live to your channels in sequence
- **Smart Distribution** — Adapts voice and angle per channel (The Strategy Pitch, BarnesLam.co, Axis Chamber)
- **Draft Review** — Content is saved to `/daily-rhythm/drafts/` for your approval before publishing

## Setup Steps

### 1. Install Dependencies
```bash
cd daily-rhythm
npm install
```

### 2. Set Environment Variables
Update your `.env` file with these API keys:

```
# Claude API (for content generation)
ANTHROPIC_API_KEY=sk-ant-...

# Blotato API (for publishing)
BLOTATO_API_KEY=blt_...
```

Get these from:
- **Claude API Key**: https://console.anthropic.com/
- **Blotato API Key**: Already in your `blotato_upload.py` file (line 12)

### 3. Start the Server
```bash
npm start
```

The scheduler will start automatically and log:
```
📅 Content Scheduler started
   Running every Sunday at 10 PM EST
   (Will publish Mon-Fri at 9 AM EST)
```

## How It Works

### Timeline (Example: Week of April 14-18, 2026)

**Sunday, April 13 @ 10 PM EST:**
- Claude generates 5 distinct LinkedIn posts + 5 Instagram carousel structures
- Saves draft to `drafts/week-content-2026-04-13.md`
- **Status: PENDING APPROVAL**

**You Review (Monday morning):**
- Check the draft file in the dashboard
- If happy: click "Approve" → posts schedule to Blotato
- If unhappy: edit the draft manually and re-approve

**Mon-Fri @ 9 AM EST:**
- Posts go live to LinkedIn pages + Instagram
- Channels get: The Strategy Pitch, BarnesLam.co, Axis Chamber (rotates)
- Each post targets your warm audience with specific DM CTAs

## Content Themes (Rotating Weekly)

The system picks one theme per week:
1. **ICP, Positioning, Pricing** — Founder GTM psychology
2. **Leadership Structure** — Delegation, authority, hiring
3. **Sales Motion** — Closing dynamics, deal sizing
4. **Operations** — Scaling systems, processes
5. **Revenue Strategy** — Unit economics, margins

New posts explore the theme from 5 different angles — no repetition.

## Customization

### Change Publishing Time
Edit `content-scheduler.js`, line with `const weeklySchedule`:
```javascript
// "0 22 * * 0" = 10 PM Sunday
// "0 9 * * 1" = 9 AM Monday
// "0 18 * * 3" = 6 PM Wednesday
const weeklySchedule = "0 22 * * 0";
```

### Change Posting Time (Mon-Fri)
Edit `functions/content-curator.js`, line in `publishPost()`:
```javascript
scheduled_at: `${date}T09:00:00Z`, // 9 AM EST
```

### Add New Themes
Edit the `themes` array in `functions/content-curator.js`:
```javascript
const themes = [
  "Your new theme here",
  ...
];
```

## Dashboard Integration

Check your content status at `http://localhost:3001`:
- **Drafts Tab**: See pending/approved content
- **Content Tab**: View all published posts
- **Logs Tab**: Track daily scheduler activity

## Troubleshooting

**"Content not generating?"**
- Check `.env` has valid `ANTHROPIC_API_KEY` and `BLOTATO_API_KEY`
- Run `npm install` to ensure all dependencies loaded
- Check logs in `daily-rhythm/logs/` for errors

**"Posts not publishing to Blotato?"**
- Verify Blotato API key is correct (from `blotato_upload.py`)
- Check your account IDs in `blotato-config.json` match what Blotato shows
- Run `npm test` to validate API connectivity (coming soon)

**"I want to pause the scheduler?"**
- Stop the server: `Ctrl+C`
- Comment out `startContentScheduler()` in `server.js`
- Restart: `npm start`

## Next Steps

✅ System is ready
👉 Run `npm install && npm start`
👉 Wait for Sunday @ 10 PM or manually trigger: `node functions/content-curator.js`
👉 Review draft and approve
👉 Posts go live Mon-Fri at 9 AM

---

**Questions?** Check the function code in:
- `/functions/content-curator.js` — Generation logic
- `/content-scheduler.js` — Weekly scheduling
- `/blotato-config.json` — Channel configuration
