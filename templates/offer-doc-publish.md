You are the autonomous GTM engine. This is a **Monday-only task**: create and publish the one-page offer doc.

## Setup
1. Read /Users/b.lamoutlook.com/daily-rhythm/gtm-profile.json for the full offer details.
2. Read /Users/b.lamoutlook.com/daily-rhythm/blotato-config.json for the offer doc channel config.
3. Read /Users/b.lamoutlook.com/daily-rhythm/target-list.json for current target signals — the offer doc should speak directly to their pain.
4. Check if /Users/b.lamoutlook.com/daily-rhythm/assets/offer-doc.md already exists.

## If offer doc doesn't exist — CREATE IT

Write a one-page offer doc at /Users/b.lamoutlook.com/daily-rhythm/assets/offer-doc.md with this structure:

```
# GTM Breakdown Session

## The problem
[2-3 sentences describing what execution-stalled operators experience. Pull language from real target signals in target-list.json. Make it feel like you're reading their mind.]

## What this is
A 90-minute, 1-on-1 diagnostic session. Not coaching. Not strategy consulting. An operator-to-operator breakdown of what's actually blocking your revenue — and the daily system to fix it.

## What you walk out with
- A prioritized execution plan: what to do this week, what to stop doing
- Your daily operating rhythm: the exact time-blocked schedule that turns your offer into consistent revenue  
- The 3 things that are stalling you (they're never what you think)

## Who this is for
Solo operators and small-team founders who have a viable offer but are stuck in the gap between knowing what to do and actually doing it.

You're not failing from lack of ideas. You're failing from lack of rhythm.

## What this costs
$750 – $1,500 depending on complexity.

## How to start
Reply to this post or DM me. We'll do a 15-minute diagnostic call first (free) to see if a full session makes sense.
```

Present the draft for approval.

## If offer doc exists — PUBLISH IT

1. Read the offer doc from /Users/b.lamoutlook.com/daily-rhythm/assets/offer-doc.md
2. Adapt it into a LinkedIn post format (under 3000 characters, conversational, not salesy)
3. Present the adapted post for approval
4. On approval, publish via mcp__blotato__blotato_create_post:
   - The Strategy Pitch: accountId "17347", platform "linkedin", pageId "103704197"
5. Also create a visual version for Instagram using mcp__blotato__blotato_create_visual (carousel format: slide 1 = hook, slide 2 = problem, slide 3 = what you get, slide 4 = CTA)
6. Publish Instagram visual: accountId "40098", platform "instagram"
7. Log to today's file under "## OFFER DOC PUBLISHED"
8. Record in tracker.json: offer_doc_published = true, date, channels

## Adaptation rules for LinkedIn post version
- Open with a hook that describes the FEELING of being stuck, not the solution
- Middle: what the session is and what you walk out with
- Close: simple CTA — "DM me" or "reply to this"
- No bullet-point lists in the LinkedIn version — write it as narrative
- Under 1500 characters for the LinkedIn post
- The full offer doc lives as a reference; the post is the invitation
