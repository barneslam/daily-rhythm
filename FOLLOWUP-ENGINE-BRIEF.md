# FollowUp Engine — Reference Brief for ChatGPT

## 1. CURRENT DASHBOARD STRUCTURE

### Main Sections (Tab Navigation)
1. **Dashboard** — Daily metrics, week timeline, connection queue, today's scorecard
2. **Targets** — All leads table with confidence filtering (90, 80, 70, 60)
3. **Lead Pipeline** — 5-stage Kanban board (identified → connection_req → connected → messaged → responded)
4. **DM Pipeline** — Inbound message monitoring with qualification scoring
5. **Content** — Auto-generated posts ready for approval/copy/edit
6. **Drafts** — Pending content with approval workflow
7. **Logs** — Daily activity logs with date picker
8. **Instructions** — Offer doc and workflow documentation
9. **8-Week Program** — Strategic coaching content by week

### Existing Features
- **Connection Queue** — Leads sorted by confidence, copy/paste invite messages, wait 24h before outreach
- **Lead Status Workflow** — Five-stage pipeline with drag-and-drop Kanban interface
- **DM Auto-Qualification** — Incoming messages from LinkedIn, email, forms, Calendly with 70%+ / 50-70% / <50% scoring tiers
- **Content Publishing** — Approve → Copy → Edit workflow for LinkedIn/Instagram posts
- **Weekly Timeline** — Visual representation of current/past/future weeks
- **Target Search** — Search by name or company across leads
- **Modal Workflows** — Status changes, connection message regeneration, DM viewing

### Existing KPIs
- Pipeline status breakdown (identified, messaged, responded, call_booked, call_completed, proposal_sent)
- Estimated value tracking
- Week number and start date
- DM qualification metrics (70%+ highly qualified, 50-70% medium, <50% low)
- Channel attribution (LinkedIn, email, forms, Calendly)
- Daily block completion tracking (trigger-scan, build-deliver, daily-log)

### Current Workflow
1. **Morning** — Connection Queue shows top leads by confidence; user copies invite messages to Sales Navigator
2. **24h Wait** — After connection request, wait before sending outreach
3. **Outreach** — Send first message to connected leads
4. **Response Tracking** — Update lead status as responses arrive (responded → messaged)
5. **Follow-up Planning** — In closing blocks, "Convert responses → calls + follow-up planning"
6. **Content Generation** — Posts auto-generated weekly (LinkedIn/Instagram), approved, and published

---

## 2. CURRENT TECHNICAL STRUCTURE

### Frontend
- **Framework**: Plain HTML/CSS/JavaScript (no React/Vue/Angular)
- **File**: `/dashboard.html` (single page, ~1500+ lines)
- **Styling**: CSS Grid, Flexbox, custom properties for theme (beige/tan/green/red color scheme)
- **Components**: 
  - Tab system (click-based switching between panels)
  - Kanban board (drag-and-drop lead cards)
  - Carousel viewer (for content posts)
  - Modal dialogs (status change, message regen, DM viewing)
  - Metric grid (for KPI display)

### Backend & APIs
- **Backend**: Node.js server (`dashboard-server.js`) running on port 3001 locally
- **Deployment**: Netlify Functions (serverless)
- **Database**: Supabase (PostgreSQL)
- **API Routing**: `/api/*` routes redirect to Netlify functions via `netlify.toml` rewrites

### Netlify Functions (Endpoints)
Key functions handling dashboard data:
- `targets.js` — Manages lead targets, confidence scoring, signal classification
- `drafts.js` — Content draft management (save, approve, delete, reject)
- `dms.js` — Inbound message handling
- `connection-message.js` — Auto-generates connection invite messages
- `content-generator.js` — Auto-generates LinkedIn/Instagram posts
- `dm-to-lead-converter.js` — Converts qualified DMs into lead pipeline entries
- `publish-scheduler.js` — Publishes approved content to Blotato
- `blotato-dm-poller.js` — Polls Blotato for incoming DMs every 30 minutes
- `schedule-discovery.js` — Lead discovery automation

### Data Flow
```
localStorage → /api/[function] → Supabase → Netlify Functions → Blotato (publish)
```

### Scheduled Functions (Netlify Cron)
- **Daily 10 AM EST (15 UTC)** — `schedule-discovery` (lead discovery)
- **Monday 8 AM EST (13 UTC)** — `content-generator` (content batch)
- **Weekdays 2 PM UTC (9 AM EST)** — `publish-scheduler` (publish approved content)
- **Every 30 minutes** — `blotato-dm-poller` (sync inbound messages)
- **Hourly** — `dm-to-lead-converter` (convert qualified DMs to leads)

### Key Dependencies
- `@supabase/supabase-js` — Database client
- `@anthropic-ai/sdk` — Claude API (for content generation)
- `node-cron` — Scheduling
- `puppeteer` — Browser automation (if needed)
- `@resvg/resvg-js` — Image rendering for graphics

### Data Structures

**Lead/Target Object**:
```javascript
{
  id, name, business, signal, confidence (60-90), status,
  audience_type, platform, quick_synopsis, tags[]
}
```

**DM Object**:
```javascript
{
  id, sender, company, message_body, channel (linkedin/email/form/calendly),
  qualification_score (0-100), status, timestamp
}
```

**Draft Object**:
```javascript
{
  id, business, content, channel (linkedin/instagram), status (pending/approved),
  created_at, scheduled_time
}
```

---

## 3. CURRENT CONTENT WORKFLOW

### LinkedIn Daily Posting
- **Schedule**: Weekdays at 9 AM EST (auto via `publish-scheduler`)
- **Content Type**: GTM-focused coaching angles (scaling, revenue leadership, execution)
- **Generation**: `generateLinkedInContent(business)` creates random angle from 4 templates
- **Publishing**: Blotato API (`accountId: '17347'`)
- **Approval**: Draft must be approved before publishing
- **Tracking**: Success/failure logged in publish logs

### Instagram / Blotato Posting
- **Schedule**: Weekdays at 9 AM EST
- **Content Type**: Shorter, punchy GTM insights
- **Generation**: `generateInstagramContent(business)` creates random angle from 4 templates
- **Publishing**: Via Blotato (carousel or text-only based on post type)
- **Tracking**: Blotato API returns confirmation

### Lead Generation Activity Tracking
- **Source**: Manual trigger-scan blocks + automated `schedule-discovery` function
- **Logging**: Daily tracker entries (companies_scanned, qualified, borderline)
- **Next Step**: Send connection requests to qualified leads
- **Frequency**: Daily during morning blocks

### Existing Fields/Workflows
**Target List Fields**:
- Name / Business (e.g., "John Smith — ACME Corp")
- Signal (e.g., "Just raised Series B funding")
- Confidence Score (60, 70, 80, 90)
- Status (identified → connection_req → connected → messaged → responded → disqualified)
- Audience Type (Enterprise, Growth-Stage, Startup, Executive)
- Platform hints (LinkedIn headline, etc.)
- Connection message (auto-generated, regenerable)

**DM Tracking**:
- Sender name
- Company
- Message body
- Qualification score (auto-assigned)
- Channel
- Response status
- Last updated timestamp

**Draft Tracking**:
- Business (who it's about)
- Content (the post copy)
- Channel (LinkedIn / Instagram)
- Status (pending / approved / published)
- Scheduled time
- Approval timestamp

---

## 4. WHAT SHOULD NOT BE CHANGED

### Existing Useful Features ✅
- **Connection Queue** — This is foundational to the outreach process; keep as-is
- **Lead Status Workflow** — 5-stage pipeline is proven; don't consolidate or change
- **Kanban Board** — Drag-and-drop interface works; keep drag-and-drop intact
- **DM Auto-Qualification** — The 70%+ / 50-70% / <50% tiers are working; don't change
- **Content Approval Flow** — Approve → Copy → Edit is low-friction; don't change
- **Weekly Timeline** — Visual week selector is useful; keep it
- **Tab Navigation** — Current tab system is working; extend, don't replace
- **Color Coding** — Confidence colors (green/orange/tan/red) are intuitive; keep consistent
- **Supabase Integration** — All database queries work; don't refactor

### Existing Logic NOT to Change
- Signal classification logic (`classifySignal()` function in targets.js)
- Connection message generation logic (template-based)
- Confidence score assignment rules
- DM qualification scoring algorithm
- Weekly block structure (morning, midday, closing)
- Content generation angles (GTM-focused messaging)

### Existing Layout Patterns
- **Card-based layout** — Blue/beige/tan theme with left border accents
- **Grid system** — Responsive CSS Grid for metrics and targets
- **Modal dialogs** — Fixed position, centered, overlay background
- **Button styles** — Consistent across all modals and actions
- **Typography** — Playfair Display for headlines, Inter for body

### What Could Break the Dashboard
- Removing or renaming Supabase tables without migrating schema
- Changing the `/api/*` routing in netlify.toml
- Deleting any Netlify function without updating references
- Modifying the lead status workflow (other parts depend on 5-stage flow)
- Changing database field names in tracker.json or targets table
- Altering the weekly block structure (morning/midday/closing)

---

## 5. CLARIFICATIONS NEEDED BEFORE EDITING

### What is "FollowUp Engine" Supposed to Do?
- **Assumption 1**: Track follow-up sequences per lead (when to follow up, frequency, what was said)
- **Assumption 2**: Auto-suggest next follow-up action based on days elapsed and lead status
- **Assumption 3**: Show which leads need follow-ups and which follow-ups are overdue
- **Clarification Needed**: Is this a new section in the dashboard, or an enhancement to existing panels?

### Missing Information
1. **Follow-up Sequences**: Should each lead have:
   - First contact → Wait N days → First follow-up?
   - Second follow-up → Wait N days → Third follow-up?
   - Custom escalation rules (e.g., if no response in 7 days, send different message)?

2. **Follow-up Templates**: Are there pre-written follow-up messages, or should they be generated?
   - Similar to connection messages (auto-generated)?
   - Or pre-defined templates the user selects from?

3. **Trigger Rules**: When should a follow-up be marked as "ready"?
   - X days since last message?
   - Lead responded but didn't book a call?
   - Proposal sent but no reply?

4. **Data Storage**: Should follow-up history live in:
   - Supabase `follow_ups` table (new)?
   - Or in the existing lead record?

### Risk Areas
1. **Notification Fatigue** — If follow-ups are suggested too aggressively, user ignores system
2. **Message Fatigue** — If the same lead gets messaged too often, it hurts your brand
3. **Timing Conflicts** — If follow-up timing doesn't align with "wait 24h after connection request" rule
4. **Status Complexity** — Could FollowUp tracking add too many status substates?

---

## 6. RECOMMENDED CHANGE AREAS FOR FOLLOWUP ENGINE

### Option A: New "Follow-Up Queue" Section
**Location**: New tab or subsection on Dashboard panel
**Shows**:
- List of leads due for follow-up (sorted by days elapsed)
- Confidence score + last activity date
- Suggested follow-up action (e.g., "Resend LinkedIn message" or "Send proposal")
- Time since last contact
- One-click "Send Follow-Up" button (pre-fills with generated or templated message)

**Data Needed**:
- `last_contacted_at` field on each lead
- `follow_up_sequence` (e.g., "Day 3", "Day 7", "Day 14")
- `next_follow_up_due_at` calculated field
- `follow_up_history` (log of all previous messages/actions)

**Benefits**:
- Keeps follow-ups visible and organized
- Prevents leads from falling through cracks
- Maintains message frequency discipline

---

### Option B: Enhance Lead Card in Kanban / Target List
**Location**: Existing Kanban cards or target list rows
**Shows**:
- Red badge "Follow-up Due" on cards needing outreach
- Next follow-up date in the card footer
- Click to open follow-up modal (similar to current status modal)

**Data Needed**:
- Same as Option A (follow-up dates, history)

**Benefits**:
- Minimal UI changes (follows existing patterns)
- Integrated into existing workflow
- Less cognitive load (follow-ups surface naturally)

---

### Option C: Timeline View (Advanced)
**Location**: New "Follow-Up Timeline" visualization
**Shows**:
- Horizontal timeline of each lead's journey
- Visual markers for key events (connection → message → response → follow-up → call → proposal)
- Color-coded status for overdue/due/upcoming follow-ups
- Click events to see details or take action

**Data Needed**:
- Complete event log per lead (timestamp, action, result)
- Timeline rendering logic

**Benefits**:
- Gives holistic view of relationship progression
- Helps spot patterns (e.g., leads that respond better on day 7)
- Looks professional

---

### Data Fields to Add (Any Option)
```javascript
// Add to Lead/Target object:
{
  ...existing fields,
  last_contacted_at,           // When was last message/interaction?
  follow_up_sequence: [         // Scheduled follow-ups
    { due_at: "2026-05-20", action: "send_message", template: "follow_up_v1" },
    { due_at: "2026-05-27", action: "send_proposal", template: null }
  ],
  follow_up_history: [          // Log of all follow-ups
    { sent_at: "2026-05-10", type: "connection", message: "..." },
    { sent_at: "2026-05-14", type: "first_followup", message: "..." }
  ],
  next_follow_up_due_at,        // Calculated: min(follow_up_sequence.due_at)
  days_since_last_contact,      // Calculated: now() - last_contacted_at
  follow_up_status              // pending, due, overdue, completed
}
```

---

### Recommended Approach
**Start with Option A + Option B combined**:
1. Add a "Follow-Ups Due" widget to the Dashboard panel (showing urgent items)
2. Add a follow-up indicator badge to existing Kanban/target list cards
3. Create a new "Follow-Up Sequence" table in Supabase
4. Auto-calculate next_follow_up_due_at based on last_contacted_at + days_between_followups
5. Keep follow-up messaging aligned with existing connection message patterns (GTM-focused)

**Avoid for now**:
- Complex timeline visualization (Option C) — save for v2
- Custom rule engine — start with simple "follow-up every 7 days" default
- AI auto-assignment — let user manual-click to send

---

## 7. TECHNICAL IMPLEMENTATION NOTES

### Files to Modify
- `dashboard.html` — Add follow-up queue section, update Kanban cards
- Create `functions/follow-ups.js` — New Netlify function for follow-up logic
- Create `functions/follow-up-scheduler.js` — Scheduled function to calculate due dates
- Update `functions/targets.js` — Add follow-up fields to lead queries
- `tracker.json` — Add follow-up tracking per day (optional)

### Supabase Schema Changes
- Add `follow_ups` table (id, lead_id, due_at, action, template, sent_at, status)
- Add columns to `targets` table: `last_contacted_at`, `next_follow_up_due_at`, `follow_up_status`

### API Endpoints to Create
- `GET /api/follow-ups?status=due` — List due follow-ups
- `POST /api/follow-ups/:leadId/send` — Send a follow-up
- `GET /api/leads/:leadId/history` — Get full contact history
- `PUT /api/leads/:leadId/follow-up-sequence` — Set follow-up schedule

### Styling Consistency
- Use existing color scheme (red for overdue, orange for due, green for completed)
- Follow existing card/modal patterns
- Use existing typography (Playfair for headers, Inter for body)

---

## 8. SUCCESS CRITERIA

The FollowUp Engine is working when:
✅ Dashboard shows "X follow-ups due today" widget  
✅ Kanban cards show red "Follow-Up Due" badge for leads needing outreach  
✅ User can click badge to view auto-generated follow-up message  
✅ Clicking "Send Follow-Up" logs the action and updates next due date  
✅ Follow-up history visible in lead details modal  
✅ Daily log captures follow-up activities  
✅ No leads fall through cracks (all responded-to leads get follow-up offer)  
✅ UI follows existing design patterns (no jarring changes)  

---

## FINAL NOTES FOR CHATGPT

This dashboard is a well-structured GTM operations tool. The FollowUp Engine should:
- **Integrate seamlessly** with existing tabs/modals/styling
- **Not add complexity** to the core workflow (connection → message → response)
- **Be unobtrusive** until a follow-up is actually due
- **Use the same message generation logic** as connections (GTM-focused angles)
- **Respect the weekly block structure** (don't ignore "wait 24h" or other timing rules)

The user is focused on lead quality and outreach discipline — the FollowUp Engine should reinforce both by making follow-up opportunities visible and actionable without overwhelming the user.
