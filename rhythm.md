# Autonomous GTM Engine — Daily Operating Rhythm

## How it works

This system runs your GTM workflow autonomously. You don't drive it — it drives you.

| Time | Block | What it does automatically | Your role |
|------|-------|---------------------------|-----------|
| 6:57 AM | Trigger Scan | Searches web for execution-stalled operators showing visible tension. Finds 3-5 real people. | Review targets |
| 8:03 AM | Outreach | Drafts personalized messages for each target using your angles. | Approve, edit, then send manually |
| 9:33 AM | Build / Deliver | Weeks 1-3: builds next infrastructure asset. Week 4+: preps client sessions. | Review deliverable |
| 12:03 PM | Follow-up | Drafts follow-ups for unanswered messages. Generates pipeline summary. | Approve follow-ups |
| 1:03 PM | Content | Auto-generates day-appropriate content (posts, case studies, comments). | Approve and publish |
| 3:03 PM | Daily Log | Compiles scorecard. No input needed. Friday = weekly summary. | Read it |

## Your only jobs
1. **Be in Claude Code before 7:00 AM**
2. **Approve or edit outreach drafts** (8:03 AM) — the one block that needs you
3. **Copy approved messages and send them** on LinkedIn/email
4. **Mark responses** — when someone replies, update target-list.json status
5. **Approve content** and publish it yourself

Everything else runs on its own.

## Manual commands
- `rhythm status` — where am I in today's schedule
- `rhythm log` — trigger the daily log early
- `rhythm week` — weekly progress against targets
- `rhythm scan` — run an extra trigger scan

## Files
```
daily-rhythm/
├── config.json          — schedule, targets, week number
├── gtm-profile.json     — ICP, triggers, outreach angles, rules
├── tracker.json         — running metrics
├── target-list.json     — all targets and their status
├── rhythm.md            — this file
├── logs/                — daily logs (YYYY-MM-DD.md)
├── content/             — generated content drafts
├── assets/              — offer doc, templates
└── templates/           — autonomous block instructions
```

## Weekly targets (Week 1)
- Messages sent: 20
- Responses: 3-5
- Calls booked: 2
- Revenue: $0 (expected)

## Re-activation
Cron jobs expire after 7 days. Say "activate my daily rhythm" to restart.
Logs, targets, and all data persist permanently.
