# Daily Rhythm Interface Wireframes
## Revenue-Focused Content & Outreach Engine

---

## DESKTOP LAYOUT (1024px+)

### Overall Structure
```
┌─────────────────────────────────────────────────────────────┐
│ Daily Rhythm - 48-Hour Opportunity Recovery Sprint          │ (Header)
└─────────────────────────────────────────────────────────────┘
┌──────────────┬───────────────────────────────────────────────┐
│   SIDEBAR    │                                               │
│              │         MAIN CONTENT AREA                     │
│ - Dashboard  │                                               │
│ - Calendar   │                                               │
│ - Assets     │         (Dynamic based on section)            │
│ - Posting    │                                               │
│ - Outreach   │                                               │
│ - Analytics  │                                               │
│ - Settings   │                                               │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

---

## 1. DASHBOARD (Default View)

### Wireframe: Dashboard Home
```
┌─────────────────────────────────────────────────────────────────┐
│  Daily Rhythm Dashboard                           [Wed, May 25] │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────┬────────────────────┬──────────────────┐
│   TODAY'S THEME        │  CONTENT STATUS    │  OUTREACH PULSE  │
│                        │                    │                  │
│ ❖ WEDNESDAY:          │ Status: Draft      │ Recent Activity  │
│  Stalled Proposal      │                    │ ═════════════════│
│  Recovery              │ [Image Preview]    │                  │
│                        │                    │ • Sarah Chen     │
│ Pain Points:           │                    │   "Tell me more" │
│ • Proposals sleeping   │ Caption Preview:   │   2 hours ago    │
│   in inboxes           │ "Found 3 stalled   │                  │
│ • No follow-up system  │  deals in my inbox │ • Marcus Reid    │
│ • Revenue leaking      │  this week..."     │   DM'd RECOVER   │
│                        │                    │   1 hour ago     │
│ ─────────────────────  │ Platform Status:   │                  │
│ CTA for Today:         │ LinkedIn: Ready    │ ─────────────────│
│ "Message RECOVER"      │ Instagram: Ready   │ Conversations    │
│                        │                    │ This Week: 5     │
│ [Compose for Wed]      │ [Edit] [Post Now]  │                  │
│                        │                    │ Waiting Replies:2│
└────────────────────────┴────────────────────┴──────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Quick Stats                                                    │
│  ═════════════════════════════════════════════════════════════  │
│  Posts This Week: 4/7  │  Outreach Sent: 8  │  Reply Rate: 75% │
│  Next Post: Thursday   │  Hot Leads: 3      │  Pending: 2      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CONTENT CALENDAR (Weekly Grid View)

### Wireframe: 7-Day Calendar
```
┌─────────────────────────────────────────────────────────────────┐
│  Content Calendar - Week of May 25                              │
└─────────────────────────────────────────────────────────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ MONDAY     │ │ TUESDAY    │ │ WEDNESDAY  │ │ THURSDAY   │
│ Opp Leak   │ │ Wasted     │ │ Stalled    │ │ Warm       │
│            │ │ Spend      │ │ Proposals  │ │ Referrals  │
│ [Image]    │ │ [Image]    │ │ [Image]    │ │ [Image]    │
│ Caption... │ │ Caption... │ │ Caption... │ │ Caption... │
│            │ │            │ │            │ │            │
│ ✓ Posted   │ │ ⏱ Sched.   │ │ ✎ Draft    │ │ ✎ Draft    │
│ LI IG      │ │ 10am Thu   │ │            │ │            │
│            │ │            │ │            │ │            │
│[Edit]      │ │[Edit]      │ │[Edit]      │ │[Edit]      │
└────────────┘ └────────────┘ └────────────┘ └────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐
│ FRIDAY     │ │ SATURDAY   │ │ SUNDAY     │
│ Follow-up  │ │ Case Study │ │ Reflection │
│ Rhythm     │ │            │ │            │
│ [Image]    │ │ [Image]    │ │ [Image]    │
│ Caption... │ │ Caption... │ │ Caption... │
│            │ │            │ │            │
│ ✎ Draft    │ │ ⊙ Idea     │ │ ⊙ Idea     │
│            │ │            │ │            │
│[Edit]      │ │[Compose]   │ │[Compose]   │
└────────────┘ └────────────┘ └────────────┘

Legend: ✓ Posted  |  ⏱ Scheduled  |  ✎ Draft  |  ⊙ Idea
```

---

## 3. POSTING COMPOSER (Multi-Platform)

### Wireframe: Composition Interface
```
┌─────────────────────────────────────────────────────────────────┐
│  Compose Post                                    [Wednesday Post]│
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┬────────────────────────────┐
│  TEXT EDITOR                     │  PLATFORM SELECTOR         │
│                                  │                            │
│ [Copy field - line length guide] │ ☑ LinkedIn                │
│                                  │   Format: Professional    │
│ "Three stalled deals in my       │ ☑ Instagram               │
│  inbox this week. $X,XXX in      │   Format: Story + Carousel│
│  revenue walking out the door    │ ☐ Direct Message          │
│  because we stopped following    │                            │
│  up.                             │ 〈 Template Suggestions    │
│                                  │   • Pain-first frame      │
│  It's not about finding new      │   • Revenue loss angle    │
│  clients. Your next customer     │   • Emotional connection  │
│  already knows your name."       │                            │
│                                  │  INSERT CTA:              │
│ [Word count] | [Line length]     │  [Message RECOVER button] │
│                                  │                            │
│ Add CTA → [+]                    │  ──────────────────────   │
│                                  │                            │
│ ═════════════════════════════════│  SCHEDULING               │
│ VISUAL ASSET                     │  Date: May 29, 2026       │
│ ┌──────────────┐                 │  Time: 9:00 AM            │
│ │ [Image Thumb]│                 │  Timezone: EST            │
│ │   Founder at │                 │                            │
│ │   laptop     │                 │  ☑ Post immediately      │
│ │  looking at  │                 │  ☐ Schedule for later    │
│ │  proposals   │                 │  ☐ Repeat weekly         │
│ │              │                 │                            │
│ └──────────────┘                 │  ─────────────────────────│
│ [Change image]                   │                            │
│ [Crop for each platform]         │  REVIEW CHECKLIST        │
│                                  │  ☑ Commercial problem first
│                                  │  ☑ Revenue focus         │
│                                  │  ☑ Emotional connection  │
│                                  │  ☑ Real-person image     │
│                                  │  ☐ Includes soft CTA     │
│                                  │                            │
│                                  │  [Preview] [Post]        │
└──────────────────────────────────┴────────────────────────────┘

PREVIEW AREA (Below):
┌──────────────────────────────┬──────────────────────────────┐
│  LinkedIn Preview            │  Instagram Preview           │
│                              │                              │
│  [Profile pic]               │  [Caption]                   │
│  John Doe                     │  Three stalled deals in my   │
│  @today                       │  inbox...                    │
│                              │                              │
│  "Three stalled deals..."     │  [Image]                     │
│                              │                              │
│  [Image]                      │  ❤️ 123  💬 45  ↗️ 12      │
│                              │                              │
│  ❤️ 234  💬 56  ↗️ 89       │                              │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 4. VISUAL ASSET MANAGER

### Wireframe: Asset Library
```
┌─────────────────────────────────────────────────────────────────┐
│  Visual Assets - Real-Person Imagery Only                       │
└─────────────────────────────────────────────────────────────────┘

FILTER BAR:
[All Assets ▼] [Founder ▼] [Meeting Context ▼] [Search: ____] [Upload +]

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ [Photo] │ │ [Photo] │ │ [Photo] │ │ [Photo] │ │ [Photo] │
│ Sarah   │ │ Marcus  │ │ Aisha   │ │ James   │ │ Priya   │
│ Founder │ │Consultant│ │Agency O │ │Service  │ │ Coach   │
│ @Laptop │ │@Inbox   │ │@Meeting │ │@CRM     │ │@Desk    │
│ #Founder│ │#Inbox   │ │#Meeting │ │#CRM     │ │#Thought │
│ 5 posts │ │ 3 posts │ │ 8 posts │ │ 2 posts │ │ 1 post  │
│[View]   │ │[View]   │ │[View]   │ │[View]   │ │[View]   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘

┌─────────┐ ┌─────────┐
│ [Photo] │ │ [Photo] │
│ Tom     │ │ Lisa    │
│ Service │ │Operator │
│ @Laptop │ │@Meeting │
│ #Service│ │#Operator│
│ 4 posts │ │ 2 posts │
│[View]   │ │[View]   │
└─────────┘ └─────────┘

[Load more assets...]
```

### Asset Detail View
```
┌─────────────────────────────────────────────────────────────────┐
│  Sarah Chen - Founder Photography                               │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────┬─────────────────────────────────────────────┐
│                    │  METADATA:                                  │
│   [LARGE IMAGE]    │  Name: Sarah Chen                           │
│   Founder at       │  Role: Founder, SaaS startup                │
│   laptop looking   │  Context: Laptop, inbox open                │
│   at email inbox   │  Tags: #founder #inbox #laptop #honest      │
│   (Real, authentic)│  Used in: 3 posts (Mon, Tue, Fri)          │
│                    │  Last used: May 24, 2026                    │
│   Captured:        │  Rights: User-generated                     │
│   May 20, 2026     │  Quality: High (executive tone)             │
│                    │                                             │
│                    │  USAGE HISTORY:                             │
│                    │  ✓ May 24: "Opportunity Leakage" (LI)      │
│                    │  ✓ May 22: "Warm Referrals" (IG)           │
│                    │  ✓ May 15: "Follow-up Breakdown" (LI)      │
│                    │                                             │
│                    │  FORMAT VARIANTS:                           │
│                    │  ✓ LinkedIn (1200x627) [Download]          │
│                    │  ✓ Instagram (1080x1080) [Download]        │
│                    │  ✓ IG Story (1080x1920) [Download]         │
│                    │                                             │
│                    │  [Use in today's post] [Edit tags]          │
│                    │  [Retire] [Delete]                          │
└────────────────────┴─────────────────────────────────────────────┘
```

---

## 5. OUTREACH HUB (Conversation Tracking)

### Wireframe: Conversation List + Thread
```
┌──────────────────────────────┬──────────────────────────────────┐
│   CONVERSATIONS (8)          │   THREAD DETAIL                  │
│                              │                                  │
│ [Search: ____]               │   Sarah Chen                     │
│ [Filter: All ▼]              │   ════════════════               │
│                              │                                  │
│ • Sarah Chen                 │   Sarah Chen                     │
│   "Tell me more about..."    │   Today, 2:15 PM                │
│   2 hours ago                │   ─────────────────────────────  │
│   ⊗ ACTIVE                   │   "Hey, this resonates. How     │
│                              │    does the sprint work?"        │
│ • Marcus Reid (HOT)          │                                  │
│   DM'd "RECOVER"             │   You                           │
│   1 hour ago                 │   Today, 3:00 PM                │
│   ⊗ ACTIVE                   │   ─────────────────────────────  │
│                              │   [Replied with sprint details] │
│ • Aisha Patel                │                                  │
│   Replied to Fri post        │   ─────────────────────────────  │
│   Yesterday                  │   Awaiting reply                │
│   ⊙ WAITING_REPLY            │                                  │
│                              │   CONTEXT TAGS:                 │
│ • James Williams             │   □ Warm lead                   │
│   Engaged, no message yet    │   ☑ Stalled proposal            │
│   3 days ago                 │   □ Missing referral            │
│   ⊗ ENGAGED                  │   □ Follow-up breakdown         │
│                              │                                  │
│ • Priya Mehta                │   STATUS: ⊗ ACTIVE              │
│   Generic compliment         │   [Change]                      │
│   1 week ago                 │                                  │
│   ○ COLD                     │   QUICK ACTIONS:                │
│                              │   [Schedule call]               │
│ [+ Mark as qualified lead]   │   [Add to CRM]                 │
│                              │   [Add note]                    │
│                              │                                  │
│                              │   ─────────────────────────────  │
│                              │   [Reply] [+ More options]      │
│                              │   [Type your message...]         │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

---

## 6. ANALYTICS DASHBOARD

### Wireframe: Weekly Performance
```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics - Week of May 25                                     │
└─────────────────────────────────────────────────────────────────┘

SUMMARY CARDS:
┌──────────────────┬──────────────────┬──────────────────┐
│  Posts Published │ Total Engagement │ Conversations    │
│  ════════════════│  ════════════════│  ════════════════│
│  5 of 7 posts    │  2,340 total     │  8 inbound       │
│  (71% cadence)   │  (+320 vs. week) │  (+3 vs. week)   │
│                  │                  │                  │
│  Next: Thursday  │  Top: Monday     │  Hot: 3          │
│  7:30 AM         │  (445 engagement)│  Pending: 2      │
└──────────────────┴──────────────────┴──────────────────┘

BY PLATFORM:
┌─────────────────────────────┬─────────────────────────────┐
│ LinkedIn Metrics            │ Instagram Metrics           │
│ ═════════════════════════   │ ═════════════════════════   │
│ Impressions: 8,420          │ Reach: 3,120                │
│ Clicks: 340 (4.0%)          │ Saves: 186 (5.9%)           │
│ Replies: 18                 │ Shares: 45                  │
│ Top Post: "Stalled Deals"   │ Top Post: "Follow-up        │
│   (2,140 impressions)       │  Rhythm" (580 reach)        │
│                             │                             │
│ [View all posts]            │ [View all posts]            │
└─────────────────────────────┴─────────────────────────────┘

OUTREACH MOMENTUM:
┌─────────────────────────────────────────────────────────┐
│ Conversations by Type                                   │
│ ═════════════════════════════════════════════════════   │
│ ▮▮▮▮▮▮▮ Stalled Proposals: 3                           │
│ ▮▮▮▮▮ Warm Referrals: 2                                │
│ ▮▮▮ Other: 3                                           │
│                                                         │
│ Reply Rate: 75% (within 24hrs)                         │
│ Conversion to Call: 50% (pending)                      │
└─────────────────────────────────────────────────────────┘

THEME PERFORMANCE (7-Day Cadence):
┌──────────────┬──────────────┬──────────────┬──────────┐
│ MONDAY       │ WEDNESDAY    │ FRIDAY       │ SUNDAY   │
│ Opp Leakage  │ Stalled Deal │ Follow-up    │ Reflect  │
│              │ Recovery     │ Rhythm       │          │
│ 445 engage   │ 380 engage   │ 520 engage   │ 240 eng  │
│ 5 conv       │ 2 conv       │ 4 conv       │ 1 conv   │
│ ▌            │ ▌            │ ▌▌           │ ▌        │
│ Strength:    │ Strength:    │ STRENGTH:    │ Ref:     │
│ emotional    │ specific     │ Highest      │ thought  │
└──────────────┴──────────────┴──────────────┴──────────┘
```

---

## MOBILE LAYOUT (375px)

### Mobile Navigation
```
┌──────────────────────────────┐
│  Daily Rhythm          ≡      │ (Hamburger menu)
└──────────────────────────────┘

┌──────────────────────────────┐
│  TODAY'S THEME               │
│  ════════════════════════════│
│  ❖ WEDNESDAY:                │
│    Stalled Proposal Recovery │
│                              │
│  [Image preview]             │
│                              │
│  Pain: Proposals sleeping    │
│  CTA: Message RECOVER        │
│                              │
│  [Compose] [Schedule]        │
└──────────────────────────────┘

┌──────────────────────────────┐
│  THIS WEEK'S CONTENT         │
│  ════════════════════════════│
│  Mon ✓ | Tue ⏱ | Wed ✎      │
│  Thu ✎ | Fri ⊙ | Sat ⊙      │
│                              │
│  [View full calendar]        │
└──────────────────────────────┘

┌──────────────────────────────┐
│  OUTREACH PULSE              │
│  ════════════════════════════│
│  • Sarah Chen (2h ago)       │
│    "Tell me more..."         │
│                              │
│  • Marcus Reid - HOT (1h)    │
│    DM'd RECOVER              │
│                              │
│  [View all conversations]    │
└──────────────────────────────┘

BOTTOM TAB NAVIGATION:
┌──────┬──────┬──────┬──────┬──────┐
│ Home │ Post │ Assets│  DMs │ More │
└──────┴──────┴──────┴──────┴──────┘
```

---

## STATE INDICATORS

### Post Status
- ✓ **Posted** (green) — Published to platform(s)
- ⏱ **Scheduled** (amber) — Queued for future publish
- ✎ **Draft** (slate) — Saved, not yet published
- ⊙ **Idea** (light) — Concept, not yet written

### Conversation Status
- ⊗ **Active** (blue) — Ongoing thread, last message <24hrs
- ⊙ **Waiting for reply** (amber) — Your last message, no response
- ◐ **Hot lead** (green) — Qualified, call scheduled
- ○ **Cold** (gray) — Low engagement, older thread

### Visual Asset Status
- ✓ **Approved** (green) — Real-person, professional, ready
- ⚠️ **Review needed** (amber) — Check authenticity/tone
- ✗ **Rejected** (red) — AI avatar, cartoon, or inappropriate

---

## INTERACTION PATTERNS

### Hover States
- All clickable cards lift with shadow: `0 4px 12px rgba(0,0,0,0.12)`
- CTA buttons shift to darker shade (Sky blue → darker blue)
- Text links underline on hover

### Focus States
- Visible blue outline (2px) on all interactive elements
- Keyboard tab order matches visual left-to-right, top-to-bottom

### Loading States
- Skeleton screens for content cards (pulse animation)
- Spinner for async operations (centered, subtle)
- No full-page overlays (keep interaction visible)

### Error States
- Toast notification (bottom-right, amber background, clear text)
- Inline field errors below form inputs (red text, white background)
- Contextual help text for recovery actions

---

**Wireframes Complete** — Ready for developer handoff.
