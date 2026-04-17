# GTM Lead & Content Manager — 3-Tab Application Specification

**Version:** 1.0  
**Status:** Design Phase  
**Build Order:** Tab 1 → Tab 2 → Tab 3  
**Tech Stack:** Node.js (server) + Vanilla JS (frontend) + Supabase (backend)

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  GTM Manager (Single-Page App)          │
│  Port: 3001 | URL: localhost:3001       │
├─────────────────────────────────────────┤
│ Tab 1: Lead Pipeline                    │
│ Tab 2: LinkedIn DMs (Warm Inbound)      │
│ Tab 3: Content Publishing (Full CMS)    │
└─────────────────────────────────────────┘
         │
         ├─→ Supabase Backend
         │   ├─ gtm_targets (58 leads)
         │   ├─ discovered_leads (daily discovery)
         │   ├─ linkedin_dms (inbound messages)
         │   ├─ content_drafts (posts & schedules)
         │   └─ publishing_history (analytics)
         │
         └─→ External APIs
             ├─ Blotato (publish posts)
             ├─ LinkedIn (DM polling webhook)
             └─ Claude Opus (content generation)
```

---

## Tab 1: Lead Pipeline (5-Column Kanban)

### UI Layout
```
HEADER:
├─ Metrics (4 cards)
│  ├─ Total Leads: 58+discovered
│  ├─ Identified: 11+new
│  ├─ Connection Req: 26
│  └─ Messaged: 1
│
└─ Filter Pills
   ├─ All (58+)
   ├─ Identified (11)
   ├─ Connection Req (26)
   ├─ Connected (2)
   ├─ Messaged (1)
   └─ Disqualified (18)

KANBAN BOARD (5 columns, drag-enabled):
├─ Column 1: IDENTIFIED
│  ├─ Lead cards (sortable by confidence)
│  │  ├─ Name (bold)
│  │  ├─ Company
│  │  └─ Confidence badge
│  │
│  └─ Expandable card details:
│     ├─ Full signal/trigger text
│     ├─ LinkedIn URL (clickable)
│     ├─ Date found
│     ├─ Status dropdown → Change to "Connection Req"
│     └─ Notes textarea
│
├─ Column 2: CONNECTION REQ (waiting for LinkedIn acceptance)
│  ├─ Lead cards
│  └─ Expandable details:
│     ├─ Date sent
│     ├─ Days elapsed
│     ├─ Mark as "Connected" button
│     └─ Notes
│
├─ Column 3: CONNECTED (ready to message)
│  ├─ Lead cards
│  └─ Expandable details:
│     ├─ Date connected
│     ├─ Suggested first message (preview)
│     ├─ Send message button
│     └─ Notes
│
├─ Column 4: MESSAGED (waiting for response)
│  ├─ Lead cards
│  └─ Expandable details:
│     ├─ Message date
│     ├─ Days elapsed (color: green <3 days, yellow 3-7, red >7)
│     ├─ Last message text
│     ├─ Mark as "Responded" button
│     └─ Follow-up note
│
└─ Column 5: RESPONDED + BOOKED + CLOSED
   ├─ Lead cards
   └─ Expandable details:
      ├─ Response date
      ├─ Call scheduled date (if booked)
      ├─ Proposal status
      ├─ Revenue closed ($)
      └─ Close notes

URGENT BANNER (if any leads overdue):
├─ "3 leads waiting 8+ days for response"
└─ Quick action: "Send follow-up to all"
```

### Data Model
```
gtm_targets:
├─ id, name, business, signal, linkedin_url
├─ status (identified|connection_req|connected|messaged|responded|booked|closed|disqualified)
├─ confidence (HIGH|MEDIUM-HIGH|MEDIUM|LOW)
├─ qualified (boolean)
├─ date_found, date_messaged, response_date, call_date
├─ message_text, response_text
├─ revenue_closed, notes
└─ created_at, updated_at

discovered_leads:
├─ id, name, company, trigger, confidence
├─ status (discovered|moved_to_targets)
├─ next_action, discovered_date, discovered_at
└─ created_at, updated_at
```

### Features
- ✅ Drag-to-move between columns
- ✅ Click card to expand details
- ✅ Inline status change dropdown
- ✅ Log contact dates automatically on transition
- ✅ Show days elapsed (color-coded urgency)
- ✅ Filter by status
- ✅ Search by name/company
- ✅ Disqualify button with reason
- ✅ Move new discovered leads to "Identified" column

---

## Tab 2: LinkedIn DMs (Warm Inbound Pipeline)

### UI Layout
```
HEADER:
├─ Metrics (4 cards)
│  ├─ Total DMs: [N]
│  ├─ Unqualified: [N]
│  ├─ Warm: [N]
│  └─ Hot: [N]
│
└─ Filter Pills
   ├─ All, Unqualified, Warm, Hot, Booked, Closed

CONVERSATION LIST (sorted by date, most recent first):
├─ Conversation card (per sender)
│  ├─ Sender name + title
│  ├─ Company
│  ├─ Latest message (preview)
│  ├─ Qualification badge (color-coded)
│  ├─ Auto-qualification score (0-100)
│  ├─ Received date + time
│  └─ Unread indicator (if new)
│
└─ Expandable conversation thread:
   ├─ Full message history (chronological)
   ├─ Qualification signals detected (highlighted)
   ├─ Auto-score breakdown
   │  ├─ Intent score (keywords, questions, urgency)
   │  ├─ Role fit (title, company size)
   │  └─ ICP fit (industry, use case)
   │
   ├─ Quick actions:
   │  ├─ Reply with template dropdown
   │  ├─ Schedule call button → date/time picker
   │  ├─ Mark qualified/disqualified
   │  └─ Add notes textarea
   │
   └─ Thread metadata:
      ├─ Sender LinkedIn URL
      ├─ Conversation started [date]
      ├─ Last reply [date]
      └─ Call booked [date/time if applicable]
```

### Data Model
```
linkedin_dms:
├─ id, conversation_id, sender_name, sender_title, sender_company
├─ message_text, received_at, is_read
├─ auto_qualified (boolean)
├─ qualification_score (0-100)
├─ qualification_signals (array: [intent, role_fit, icp_fit])
├─ qualification_notes (text)
├─ status (new|warm|hot|booked|closed)
├─ call_booked_date, call_completed_date
├─ user_notes
└─ created_at, updated_at
```

### Features
- ✅ Real-time DM polling from Blotato/LinkedIn API
- ✅ Auto-qualification scoring (intent + role + ICP)
- ✅ Quick reply templates (role-specific)
- ✅ Schedule call button → Calendly integration
- ✅ Mark as qualified/disqualified with reason
- ✅ Conversation history per sender
- ✅ Filter by qualification status
- ✅ Unread badge
- ✅ Search by sender name/company

---

## Tab 3: Content Publishing (Full CMS)

### UI Layout
```
HEADER:
├─ Metrics (4 cards)
│  ├─ Posts scheduled: [N]
│  ├─ Posts published (this month): [N]
│  ├─ Total reach: [N]
│  └─ Avg engagement rate: [%]
│
└─ View options: Calendar | List | Channel

CALENDAR VIEW (Mon-Fri grid, next 4 weeks):
├─ Week 1 (Mon-Fri)
│  ├─ Monday 9 AM
│  │  ├─ Post 1 (title preview)
│  │  ├─ Channels: LinkedIn, Instagram
│  │  └─ Status: Scheduled
│  │
│  ├─ Tuesday 9 AM
│  │  └─ [similar structure]
│  │
│  └─ (Wed-Fri similar)
│
└─ (Weeks 2-4 similar)

SIDEBAR: Upload/Create Post Form
├─ Post type selector
│  ├─ Auto-generated (from Claude)
│  ├─ Custom text
│  ├─ Image/carousel
│  └─ Video/reel
│
├─ Content input
│  ├─ Post text (markdown editor)
│  ├─ Image upload (drag-drop)
│  ├─ Video URL (for Blotato reel)
│  └─ CTA selector (DM me, Reply with X, etc.)
│
├─ Channel selection (multi-select)
│  ├─ ☑ LinkedIn Personal
│  ├─ ☑ Biz Dev Titans
│  ├─ ☑ Growth Gurus
│  ├─ ☑ The Strategy Pitch
│  ├─ ☑ AXIS Chamber
│  ├─ ☑ Instagram @bizdevtitans
│  └─ ☑ Facebook (if configured)
│
├─ Channel-specific adaptations
│  ├─ Auto-adapt voice/tone per channel (toggle)
│  ├─ Character count warnings per platform
│  └─ Preview per channel
│
├─ Scheduling
│  ├─ Publish mode:
│  │  ├─ ☑ Auto (Mon-Fri 9 AM)
│  │  ├─ ○ Manual date/time picker
│  │  └─ ○ Draft (no auto-publish)
│  │
│  ├─ Date/time picker (if manual)
│  │  ├─ Day selector
│  │  └─ Time selector
│  │
│  └─ Override global schedule (toggle)
│
└─ Action buttons:
   ├─ [Preview] (shows per-channel preview)
   ├─ [Schedule] (saves to publishing_history)
   ├─ [Save as template]
   └─ [Cancel]

PUBLISHING HISTORY:
├─ List of published posts (past 8 weeks)
│  ├─ Post title/preview
│  ├─ Channels posted to
│  ├─ Publish date/time
│  ├─ Status (published|scheduled|failed)
│  ├─ Engagement (if available from Blotato API)
│  │  ├─ Likes, comments, shares, clicks
│  │  └─ Reach estimate
│  │
│  ├─ Actions:
│  │  ├─ [View] (full post)
│  │  ├─ [Repost] (duplicate to new date)
│  │  └─ [Analyze] (engagement breakdown)
│  │
│  └─ Filters: By channel, by week, by status

TEMPLATE LIBRARY:
├─ Saved templates (user-created)
│  ├─ Template name, created date
│  ├─ [Use] button
│  ├─ [Edit] / [Delete]
│  └─ (Expand to show preview)
│
└─ System templates (from content-curator)
   ├─ Latest weekly batch
   ├─ Past weeks (archive)
   └─ (Click to load into form)
```

### Data Model
```
content_drafts:
├─ id, title, content (markdown)
├─ post_type (auto_generated|custom_text|image|video)
├─ image_url (if applicable), video_url
├─ channels (array: [linkedin_personal, biz_dev_titans, ...])
├─ voice_adaptations (boolean) — auto-tone per channel
├─ channel_variations (json: {channel_id: "adapted_text"})
│
├─ scheduling:
│  ├─ publish_mode (auto|manual|draft)
│  ├─ scheduled_date (if manual)
│  ├─ scheduled_time (HH:MM, if manual)
│  ├─ override_global_schedule (boolean)
│  └─ days_of_week (array: [1-5 for Mon-Fri] if auto)
│
├─ status (draft|scheduled|published|failed)
├─ published_date, published_time
├─ blotato_post_ids (array: [post_id_per_channel])
├─ cta_type (dm_me|reply_with|schedule_call|etc)
├─ is_template (boolean)
│
└─ created_at, updated_at

publishing_history:
├─ id, draft_id
├─ channels_published (array)
├─ published_at
├─ blotato_response (json: {channel: post_id, url})
├─ engagement (json: {likes, comments, shares, reach})
├─ status (published|scheduled|failed)
├─ error_message (if failed)
│
└─ created_at, updated_at
```

### Features
- ✅ Upload custom posts (text, image, video)
- ✅ Multi-channel selection with voice adaptation
- ✅ Calendar view (schedule at a glance)
- ✅ Schedule to future dates (Mon-Fri or custom)
- ✅ Auto-publish on schedule
- ✅ Manual override dates
- ✅ Draft mode (save without publishing)
- ✅ Template library (save & reuse)
- ✅ Publishing history with engagement metrics
- ✅ Auto-generated content templates (from content-curator)
- ✅ Channel-specific character count warnings
- ✅ Per-channel preview before publish
- ✅ One-click repost to different date

---

## Database Schema (Supabase)

```sql
-- Tab 1: Leads
-- gtm_targets — already exists, no changes needed

-- Tab 2: DMs
CREATE TABLE linkedin_dms (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  conversation_id TEXT NOT NULL UNIQUE,
  sender_name TEXT NOT NULL,
  sender_title TEXT,
  sender_company TEXT,
  sender_linkedin_url TEXT,
  message_text TEXT,
  received_at TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  auto_qualified BOOLEAN DEFAULT FALSE,
  qualification_score INT DEFAULT 0,
  qualification_signals JSONB,
  qualification_notes TEXT,
  status TEXT DEFAULT 'new',
  call_booked_date DATE,
  call_completed_date DATE,
  user_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tab 3: Content
CREATE TABLE content_drafts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT,
  content TEXT,
  post_type TEXT,
  image_url TEXT,
  video_url TEXT,
  channels JSONB,
  voice_adaptations BOOLEAN DEFAULT FALSE,
  channel_variations JSONB,
  publish_mode TEXT DEFAULT 'draft',
  scheduled_date DATE,
  scheduled_time TIME,
  override_global_schedule BOOLEAN DEFAULT FALSE,
  days_of_week JSONB,
  status TEXT DEFAULT 'draft',
  published_date DATE,
  published_time TIME,
  blotato_post_ids JSONB,
  cta_type TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE publishing_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  draft_id BIGINT REFERENCES content_drafts(id),
  channels_published JSONB,
  published_at TIMESTAMP,
  blotato_response JSONB,
  engagement JSONB,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints (Node.js + Express)

```
TAB 1: LEAD PIPELINE
GET  /api/leads/all                    — Get all leads + discovered
GET  /api/leads/status/:status         — Filter by status
POST /api/leads/:id/update-status      — Move lead between columns
POST /api/leads/:id/add-note           — Add internal note
POST /api/leads/:discovered-lead/move  — Move discovered to identified

TAB 2: LINKEDIN DMS
GET  /api/dms                          — Get all conversations
GET  /api/dms/status/:status           — Filter by qualification
POST /api/dms/:conversation-id/reply   — Send reply
POST /api/dms/:conversation-id/qualify — Mark qualified/hot
POST /api/dms/:conversation-id/book-call — Schedule call

TAB 3: CONTENT PUBLISHING
GET  /api/content/drafts               — Get all drafts
GET  /api/content/history              — Publishing history
POST /api/content/create               — Create draft
POST /api/content/:id/schedule          — Schedule publish
POST /api/content/:id/publish           — Immediate publish
GET  /api/content/templates            — Saved templates
POST /api/content/:id/save-template    — Save as template
POST /api/content/:id/repost           — Duplicate to new date
```

---

## Build Timeline

**Phase 1 (Week 1): Tab 1 — Lead Pipeline**
- Kanban board UI (5 columns)
- Lead card components (expand/collapse)
- Drag-to-move logic
- Status update API
- Filter/search

**Phase 2 (Week 2): Tab 2 — LinkedIn DMs**
- Conversation list
- Message thread display
- Auto-qualification scoring
- Quick reply templates
- Call scheduling integration

**Phase 3 (Week 3): Tab 3 — Content Publishing**
- Post upload form (text, image, video)
- Channel multi-select
- Calendar view
- Scheduling logic
- Publishing to Blotato API
- Template library

---

## Design System (Existing)

```css
Colors:
--bg: #fffdf7 (cream)
--surface: #f5f0e8 (beige)
--surface2: #ede8de (light beige)
--border: #d8d0c0 (tan)
--text: #1a1714 (dark brown)
--muted: #6b6560 (gray)
--accent: #a07828 (gold)
--accent-dark: #8a6620 (dark gold)
--green: #4a7c59 (success)
--red: #a04040 (error)
--orange: #c47a1a (warning)
--blue: #5a7898 (info)

Typography:
Headings: Playfair Display (serif)
Body: Inter (sans-serif)

Components:
Cards, pills/badges, buttons, modals, tabs, grids
(See closing-dashboard.html for reference)
```

---

## Success Metrics

**Tab 1:**
- Lead velocity (days from identified → messaged)
- Connection acceptance rate (% of connection reqs accepted)
- Response rate (% of messaged leads that respond)
- Close rate (messaged → call booked → closed)

**Tab 2:**
- DM response time (avg hours to reply)
- Qualification accuracy (auto vs manual comparison)
- Call booking rate from DMs
- Close rate from warm pipeline

**Tab 3:**
- Post publishing rate (actual vs scheduled)
- Engagement per channel (likes, comments, reach)
- Click-through rate (CTAs, links)
- Cost per engaged lead (from content vs cold outreach)

---

**Last Updated:** 2026-04-17  
**Next Step:** Build Tab 1 (Lead Pipeline kanban)
