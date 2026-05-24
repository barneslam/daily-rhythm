# 48-Hour Recovery Sprint - Setup & Deployment Guide

## ✅ What's Ready

### 1. Landing Page
- **File**: `recover.html`
- **URL**: `https://daily-lead-gen-track.netlify.app/recover`
- **Features**:
  - Hero section with main value prop
  - Problem statement (4 key pain points)
  - Solution overview (7 deliverables)
  - Pricing display ($250 founding, $750 standard)
  - Contact form ("Message RECOVER")
  - Calendly booking integration

### 2. 7-Day Content Cadence
- **File**: `content-cadence-week1.md`
- **All 7 posts written** with:
  - Daily themes (Mon-Sun)
  - High-resolution Unsplash images (free, properly attributed)
  - Specific CTAs and positioning
  - Social copy ready for LinkedIn & Instagram

### 3. Photo Guidelines
- **File**: `photo-guidelines.md`
- Comprehensive visual requirements
- Free sources: Unsplash, Pexels, Pixabay
- DO/DON'T list and text overlay rules
- Color palette specifications

### 4. Scheduling Config
- **File**: `recovery-sprint-schedule.json`
- 7-day posting schedule (May 26 - June 1)
- Channel assignments per day
- Image URLs and CTAs

### 5. Contact Form Handling
- **Function**: `functions/recover-contact.js`
- **Endpoint**: `/api/recover-contact` (POST)
- Captures name, email, LinkedIn, message
- Saves to Supabase `recover_contacts` table
- Redirects to Calendly booking

### 6. Daily Publishing
- **Function**: `functions/publish-recovery-sprint.js`
- Scheduled daily at 9 AM EST (14 UTC)
- Provides post data ready for Blotato

---

## 📋 Next Steps (To Complete)

### 1. Create Supabase Table (One-time)
```sql
CREATE TABLE recover_contacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  linkedin TEXT,
  message TEXT,
  source TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recover_contacts_email ON recover_contacts(email);
CREATE INDEX idx_recover_contacts_source ON recover_contacts(source);
```

**Run this in Supabase SQL Editor:**
1. Go to Supabase project dashboard
2. Navigate to SQL Editor
3. Create new query
4. Paste the SQL above
5. Execute

### 2. Schedule Posts in Blotato (Manual for Week 1)
Since Blotato API key authentication setup is pending, posts must be scheduled manually:

1. **Log in** to `my.blotato.com`
2. **For each day (Mon-Sun)**:
   - Click "Create Post"
   - Select account (LinkedIn Personal or Instagram)
   - Copy text from `content-cadence-week1.md`
   - Add image URL from `recovery-sprint-schedule.json`
   - Set schedule for 9 AM EST that day
   - Add CTA: "Message RECOVER" with link to `/recover` page

**OR** use the quick links below:

**Monday (May 26)** - LinkedIn Personal
- Image: https://images.unsplash.com/photo-1600267165477-6d4cc741b379
- Copy: Opportunity Leakage Pain (from content-cadence-week1.md)

**Tuesday (May 27)** - The Strategy Pitch
- Image: https://unsplash.com/photos/office-desk-with-smartphone-and-financial-charts-heiYgqp0Tsk
- Copy: Wasted Lead Generation Spend

**Wednesday (May 28)** - Biz Dev Titans
- Image: https://unsplash.com/photos/woman-signing-on-white-printer-paper-beside-woman-about-to-touch-the-documents-HJckKnwCXxQ
- Copy: Stalled Proposal Recovery

**Thursday (May 29)** - LinkedIn Personal
- Image: https://images.unsplash.com/photo-1630487656049-6db93a53a7e9
- Copy: Warm Referrals That Went Quiet

**Friday (May 30)** - AXIS Chamber
- Image: https://images.unsplash.com/photo-1435527173128-983b87201f4d
- Copy: Follow-Up Breakdown + Recovery Rhythm

**Saturday (May 31)** - Growth Gurus
- Image: https://images.unsplash.com/photo-1515378791036-0648a3ef77b2
- Copy: Case Study — The $75K Conversation

**Sunday (June 1)** - LinkedIn Personal
- Image: https://images.unsplash.com/photo-1511203466129-824e631920d7
- Copy: Founder Reality / Personal Reflection

### 3. Test Landing Page Flow
1. Visit `https://daily-lead-gen-track.netlify.app/recover`
2. Click "Message RECOVER" button
3. Fill out contact form
4. Verify form submission (check Supabase table)
5. Verify redirect to Calendly

### 4. Update Bio/CTA Links
- Add recovery sprint page to LinkedIn bio
- Update Calendly link: `https://calendly.com/barneslam`

---

## 🔧 Troubleshooting

**Landing page returns 404?**
- Ensure `recover.html` is in root directory
- Check `netlify.toml` has `/recover` redirect rule

**Form submission not working?**
- Verify Supabase credentials in `.env`
- Check `recover_contacts` table exists
- Check browser console for errors

**Images not loading?**
- All image URLs are direct Unsplash links (public)
- No authentication required
- Verify URLs are correct in content posts

**Blotato posting issues?**
- API key may need to be set in Netlify environment variables
- Manual scheduling via `my.blotato.com` is the interim solution
- Future: Implement OAuth flow for Blotato API

---

## 📊 Monitoring

### Dashboard Endpoints
- `/api/recover-contacts` (GET) — View all submissions
- `/api/publish-recovery-sprint` (GET) — Check daily post status

### Supabase Table
- `recover_contacts` — All landing page form submissions
- Query: `SELECT * FROM recover_contacts ORDER BY submitted_at DESC`

---

## 💾 Files Changed/Created

**New Files:**
- `recover.html` — Landing page
- `content-cadence-week1.md` — All 7 posts with images
- `photo-guidelines.md` — Visual requirements
- `photo-mapping.json` — Image mapping by day
- `recovery-sprint-schedule.json` — Publishing schedule config
- `functions/recover-contact.js` — Contact form handler
- `functions/publish-recovery-sprint.js` — Daily post scheduler
- `RECOVERY-SPRINT-SETUP.md` — This guide

**Modified Files:**
- `netlify.toml` — Added `/recover` route and daily publishing schedule

---

## 🎯 Success Criteria

- [ ] Landing page accessible at `/recover` URL
- [ ] All 7 posts scheduled in Blotato for May 26 - June 1
- [ ] Contact form captures submissions to Supabase
- [ ] Form redirects to Calendly booking page
- [ ] Analytics tracking enabled (optional: add UTM params)
- [ ] First 3 sprint clients acquired within launch week
