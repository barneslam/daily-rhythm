# Phase 1 Development Plan - Daily Rhythm Revenue Engine
## MVP: Dashboard + Calendar + Composer

**Duration:** 2 weeks  
**Start Date:** May 25, 2026  
**End Date:** June 8, 2026

**Goal:** Enable end-to-end content publishing for one complete 7-day cycle

---

## 📋 PHASE 1 DELIVERABLES

### Core Features
1. ✅ **Sidebar Navigation** — 7 main sections (though MVP only shows Dashboard, Calendar, Posting)
2. ✅ **Dashboard View** — Today's theme + content status + outreach pulse
3. ✅ **Content Calendar** — 7-day grid view with status indicators
4. ✅ **Posting Composer** — Multi-platform (LinkedIn + Instagram), format switching, scheduling
5. ✅ **Basic Analytics** — Post counts, status indicators, weekly metrics
6. ✅ **Design System Implementation** — All colors, typography, spacing, components

### Success Criteria
- [ ] All pages load and render correctly
- [ ] Navigation between sections works smoothly
- [ ] Can compose post with text + image
- [ ] Can schedule across LinkedIn + Instagram with different formats
- [ ] 7-day calendar displays with proper status indicators
- [ ] Dashboard shows today's theme and content status
- [ ] All interactive elements have proper hover/focus states
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1024px+)
- [ ] Accessibility standards met (WCAG AA)
- [ ] Ready to publish 7 posts across one week

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack
- **Frontend:** HTML5 + CSS3 (Tailwind CSS recommended) + Vanilla JS OR lightweight framework
- **Backend:** Node.js (existing) with new API endpoints for Daily Rhythm
- **Database:** Supabase (existing) with new tables for content, assets, outreach
- **Styling:** CSS variables from DESIGN_TOKENS.md
- **Fonts:** Google Fonts (Poppins + Open Sans)

### Directory Structure
```
/daily-rhythm/
├── src/                          # NEW
│   ├── pages/                    # Page templates
│   │   ├── dashboard.html        # Dashboard view
│   │   ├── calendar.html         # Content calendar
│   │   ├── composer.html         # Posting composer
│   │   ├── assets.html           # Asset manager (Phase 2)
│   │   ├── outreach.html         # Outreach hub (Phase 2)
│   │   └── analytics.html        # Analytics (Phase 2)
│   ├── css/
│   │   ├── design-tokens.css     # All variables (from DESIGN_TOKENS.md)
│   │   ├── layout.css            # Sidebar, grid, responsive
│   │   ├── components.css        # Buttons, cards, forms
│   │   └── responsive.css        # Mobile-first breakpoints
│   ├── js/
│   │   ├── app.js                # Main app controller
│   │   ├── dashboard.js          # Dashboard logic
│   │   ├── calendar.js           # Calendar view logic
│   │   ├── composer.js           # Posting composer logic
│   │   ├── api.js                # API client
│   │   └── utils.js              # Helper functions
│   └── index.html                # Main entry point (new)
├── functions/                    # NEW - Backend API functions
│   ├── daily-rhythm-create-post.js
│   ├── daily-rhythm-schedule-post.js
│   ├── daily-rhythm-get-content.js
│   ├── daily-rhythm-get-calendar.js
│   └── daily-rhythm-analytics.js
├── supabase/
│   └── migrations/               # NEW - Database schema
│       └── daily_rhythm_tables.sql
└── [existing files...]
```

---

## 🎨 DESIGN SYSTEM IMPLEMENTATION

### CSS Architecture
```css
/* design-tokens.css - All variables */
:root {
  /* Colors */
  --color-primary-900: #0F172A;
  --color-accent-600: #0369A1;
  /* ... all tokens from DESIGN_TOKENS.md ... */
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  /* ... etc ... */
}

/* layout.css - Structure */
.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  height: 100vh;
}

.sidebar { 
  background: var(--color-primary-900);
  color: white;
  padding: var(--space-6);
}

.main-content {
  overflow-y: auto;
  background: var(--color-neutral-50);
}

/* components.css - Reusable components */
.card {
  background: var(--color-neutral-0);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.button-primary {
  background-color: var(--color-accent-600);
  color: white;
  /* ... etc ... */
}
```

### Typography
Import Google Fonts in `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 🗄️ DATABASE SCHEMA (Supabase)

### Tables Needed for Phase 1

**1. content_pieces**
```sql
CREATE TABLE content_pieces (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  user_id UUID NOT NULL,
  
  title VARCHAR(500),
  body TEXT,
  theme_day VARCHAR(20), -- MON, TUE, WED, THU, FRI, SAT, SUN
  
  -- Platform-specific variants
  linkedin_text TEXT,
  instagram_text TEXT,
  direct_text TEXT,
  
  image_url VARCHAR(2000),
  image_id UUID, -- Link to visual_assets table
  
  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  
  -- Status
  status VARCHAR(20), -- draft, scheduled, posted, failed
  posted_platforms VARCHAR(100), -- json array: ['linkedin', 'instagram']
  posted_at TIMESTAMP,
  
  -- Metadata
  cta_text VARCHAR(200),
  tags VARCHAR(500), -- comma-separated
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX idx_content_user_date ON content_pieces(user_id, scheduled_date);
CREATE INDEX idx_content_status ON content_pieces(status);
```

**2. visual_assets**
```sql
CREATE TABLE visual_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  user_id UUID NOT NULL,
  
  filename VARCHAR(500),
  image_url VARCHAR(2000),
  storage_path VARCHAR(500),
  
  -- Metadata
  alt_text TEXT,
  context_tags VARCHAR(500), -- founder, consultant, laptop, inbox, meeting, etc
  person_name VARCHAR(200),
  person_type VARCHAR(100), -- founder, consultant, agency_owner, etc
  
  -- Usage tracking
  used_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  
  -- Quality/approval
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  notes TEXT,
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE INDEX idx_assets_user ON visual_assets(user_id);
CREATE INDEX idx_assets_tags ON visual_assets(context_tags);
```

**3. posting_analytics**
```sql
CREATE TABLE posting_analytics (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT now(),
  
  content_id UUID NOT NULL REFERENCES content_pieces(id),
  platform VARCHAR(20), -- linkedin, instagram, direct
  
  -- Performance metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- Engagement tracking
  engagement_rate DECIMAL,
  
  -- External IDs (for linking to platform data)
  platform_post_id VARCHAR(200),
  
  CONSTRAINT fk_content FOREIGN KEY (content_id) REFERENCES content_pieces(id)
);

CREATE INDEX idx_analytics_content ON posting_analytics(content_id);
CREATE INDEX idx_analytics_platform ON posting_analytics(platform);
```

---

## 📱 COMPONENT SPECIFICATIONS

### 1. SIDEBAR NAVIGATION

**Layout:**
- 300px fixed width on desktop
- Collapses to hamburger on mobile (<768px)
- Navy background (#0F172A)
- White text

**Navigation Items:**
- Logo/Title (25px)
- Dashboard (icon + text)
- Content Calendar
- Visual Assets
- Posting
- Outreach Hub
- Analytics
- Settings
- Logout (bottom)

**States:**
- Hover: Slight background lightening
- Active: Sky blue accent left border + text highlight

---

### 2. DASHBOARD VIEW

**Grid Layout:** 3-column on desktop, 1-column on mobile

**Column 1: TODAY'S THEME**
- Theme title (e.g., "MONDAY: Opportunity Leakage")
- Pain points (bulleted list)
- Key copy themes
- Suggested CTA
- [Compose Button]

**Column 2: CONTENT STATUS**
- LinkedIn status (posted/scheduled/draft)
- Instagram status (posted/scheduled/draft)
- Visual preview (small thumbnail)
- Post preview (first 100 chars)
- [Edit] [Post Now] buttons

**Column 3: OUTREACH PULSE**
- Recent inbound messages (3 most recent)
- Hot leads indicator
- "RECOVER" message count
- [View All] link

**Summary Cards (Below):**
- Posts This Week: X/7
- Outreach Sent: X
- Reply Rate: X%

---

### 3. CONTENT CALENDAR

**Grid View:** 7 columns (Mon-Sun) on desktop, responsive on mobile

**Each Day Card Shows:**
- Day name (MON)
- Theme (Opportunity Leakage)
- Image thumbnail
- Caption preview (2 lines)
- Status badge (✓ Posted, ⏱ Scheduled, ✎ Draft, ⊙ Idea)
- Platform indicators (LI ✓ IG ✓)

**Colors:**
- Draft: Amber background + border
- Scheduled: Light gray background
- Posted: Green background
- Idea: Very light gray

**Interactions:**
- Click card → Opens composer for that day
- Drag card → Reschedule to different day
- Status badge → Quick view of what's been posted

---

### 4. POSTING COMPOSER

**3-Column Layout:**

**Left Column: TEXT EDITOR**
- Heading: "Compose Post - [DAY]"
- Text area with character count
- Line length guide (65-75 chars)
- Template suggestions (dropdown)
- Add CTA button
- Word count display

**Center Column: VISUAL PREVIEW**
- Large image upload area (drag-drop)
- Image thumbnail preview
- [Change Image] button
- Format crop options

**Right Column: POSTING OPTIONS**

*Platform Toggle:*
- Checkbox: LinkedIn (if checked, show LinkedIn copy)
- Checkbox: Instagram (if checked, show IG copy)

*Platform-Specific Fields:*
- LinkedIn caption (longer form)
- Instagram caption (shorter, hashtags)
- CTA selector (dropdown)

*Scheduling:*
- Date picker
- Time picker
- Timezone selector
- ☑ Schedule now / ☐ Schedule for later

*Review Checklist:*
- ☑ Commercial problem first
- ☑ Revenue focus
- ☑ Real-person image
- ☑ CTA included
- ☑ No motivational fluff

*Actions:*
- [Preview] button
- [Schedule] / [Post Now] button

**Preview Section (Below):**
- LinkedIn preview card
- Instagram preview card
- Side-by-side comparison

---

### 5. BASIC ANALYTICS

**Summary Cards:**
- Posts This Week: 5/7 (71%)
- Total Engagement: 2,340 (+320 vs last week)
- Conversations Started: 8 (+3 vs last week)

**By Platform:**

*LinkedIn:*
- Impressions: 8,420
- Engagement rate: 4.0%
- Top post: "Stalled Deals" (2,140 impressions)

*Instagram:*
- Reach: 3,120
- Saves: 186
- Top post: "Follow-up Rhythm" (580 reach)

**Theme Performance:**
- Bar chart: Mon vs Tue vs Wed vs Thu vs Fri vs Sat vs Sun
- Show which day had highest engagement

---

## 🔌 API ENDPOINTS NEEDED (Backend)

### Authentication
- `POST /api/auth/login` — Existing
- `POST /api/auth/logout` — Existing

### Content Management
- `POST /api/daily-rhythm/content` — Create new post
- `GET /api/daily-rhythm/content` — Fetch posts (filter by date/status)
- `PUT /api/daily-rhythm/content/:id` — Update post
- `DELETE /api/daily-rhythm/content/:id` — Delete post
- `POST /api/daily-rhythm/content/:id/schedule` — Schedule post
- `POST /api/daily-rhythm/content/:id/publish` — Publish immediately

### Visual Assets
- `POST /api/daily-rhythm/assets/upload` — Upload image
- `GET /api/daily-rhythm/assets` — List assets with filtering
- `DELETE /api/daily-rhythm/assets/:id` — Delete asset

### Analytics
- `GET /api/daily-rhythm/analytics/weekly` — Weekly metrics
- `GET /api/daily-rhythm/analytics/by-theme` — Performance by theme
- `GET /api/daily-rhythm/analytics/by-platform` — Performance by platform

### Platforms
- `POST /api/daily-rhythm/publish/linkedin` — Publish to LinkedIn
- `POST /api/daily-rhythm/publish/instagram` — Publish to Instagram
- `POST /api/daily-rhythm/publish/schedule` — Schedule across platforms

---

## ✅ IMPLEMENTATION CHECKLIST

### Week 1 (May 25 - June 1)

- [ ] Set up file structure (src/, css/, js/, functions/)
- [ ] Create design-tokens.css with all variables
- [ ] Create base layout.html with sidebar + main grid
- [ ] Implement responsive navigation
- [ ] Create layout.css, components.css, responsive.css
- [ ] Build Dashboard page (HTML + CSS)
- [ ] Build Content Calendar page (HTML + CSS)
- [ ] Create Supabase tables (content_pieces, visual_assets, posting_analytics)
- [ ] Build basic API endpoints (get content, create content)

**Milestone:** Static pages render correctly, responsive on all breakpoints

### Week 2 (June 1 - June 8)

- [ ] Build Posting Composer page (HTML + CSS)
- [ ] Connect text editor + image upload to backend
- [ ] Implement scheduling logic
- [ ] Implement platform selector (LinkedIn/Instagram)
- [ ] Add image cropping for format variants
- [ ] Build Analytics page (basic version)
- [ ] Create publish endpoints for both platforms
- [ ] Add form validation
- [ ] Test all workflows end-to-end
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance audit

**Milestone:** Can publish 7 posts across one week, schedule posts, view analytics

### Quality Assurance

- [ ] Test on Chrome, Safari, Firefox
- [ ] Mobile testing (iPhone SE, Android)
- [ ] Form validation edge cases
- [ ] Image upload errors
- [ ] Scheduling timezone handling
- [ ] Database constraints
- [ ] API error handling
- [ ] Loading states

---

## 🚀 LAUNCH READINESS

**Before going live:**
1. All checkboxes above are ✅
2. Security review (no hardcoded secrets, input validation)
3. Performance testing (load times <2s)
4. Backup + rollback plan
5. Error monitoring setup (Sentry or similar)
6. User documentation

---

## 📞 TEAM ASSIGNMENTS

**Needed roles:**
- Frontend developer (HTML/CSS/JS)
- Backend developer (Node.js APIs)
- Database engineer (Supabase setup)
- QA/Testing specialist
- Product owner (requirements, approvals)

---

## 🎯 SUCCESS METRICS (Phase 1)

After 2 weeks, we should be able to:
- ✅ Compose 7 posts for the upcoming week (Mon-Sun)
- ✅ Schedule posts across LinkedIn and Instagram
- ✅ View status (draft, scheduled, posted) in calendar
- ✅ See basic performance metrics
- ✅ Publish all 7 posts without manual intervention
- ✅ Dashboard shows today's theme and content status
- ✅ All pages responsive and accessible

---

**Next:** Begin development with frontend setup.
