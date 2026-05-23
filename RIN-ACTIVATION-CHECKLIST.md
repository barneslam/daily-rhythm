# RIN Publishing Pipeline — Activation Checklist

**Status**: Ready to activate  
**Timeline**: 5 minutes to start, 30 minutes for first test  
**Created**: 2026-05-04

---

## ✅ What's Already Done

- [x] GTM profile created (`gtm-profile-rin.json`)
- [x] Publishing config created (`config-rin.json`)
- [x] Blotato API key: same as yours (already linked)
- [x] Facebook page: RIN Tow Driver Network Canada (ID: 61589010212907)
- [x] Instagram: @roadside_intelligence

---

## 🚀 Activate Now (Do These 5 Things)

### 1. Verify Blotato Accounts Are Linked
Go to: **https://blotato.com → Settings → Connected Accounts**

Look for:
- ✅ Facebook: "RIN Tow Driver Network Canada"
- ✅ Instagram: "roadside_intelligence"

**If missing**: Click "Connect Account" and re-authorize.

**Time**: 2 minutes

---

### 2. Create RIN Drafts Directory

```bash
mkdir -p /Users/b.lamoutlook.com/daily-rhythm/drafts/rin
```

**Time**: 10 seconds

---

### 3. Create First Test Draft

```bash
cat > /Users/b.lamoutlook.com/daily-rhythm/drafts/rin/carousel-rin-2026-05-12.md << 'EOF'
---
date: 2026-05-12
type: carousel
channel: facebook,instagram
status: approved
---

# RIN: Dispatch Intelligence

## Slide 1: The Problem
Manual dispatch = 2+ hours/day wasted.
Double bookings. Idle drivers. Chaos.

## Slide 2: Smart Matching
Real-time optimization.
Drivers know their next job before they finish the current one.

## Slide 3: The Result
2 hours saved per day.
More jobs assigned.
Drivers stay longer.

## Slide 4: The Call
Fair dispatch. Real-time optimization. Built for operators.

**Join the network:** drive.roadside.ai
EOF
```

**Time**: 1 minute

---

### 4. Sync Draft to Supabase

```bash
cd /Users/b.lamoutlook.com/daily-rhythm && node sync-drafts-to-supabase.js
```

Check output:
```
✅ Synced carousel-rin-2026-05-12.md
```

**Time**: 30 seconds

---

### 5. Test Publishing to Blotato

```bash
node publish-drafts.js --brand RIN --date 2026-05-12 --dry-run
```

Should output:
```
📤 Publishing to Facebook: RIN Tow Driver Network Canada
📤 Publishing to Instagram: @roadside_intelligence
✅ Dry run complete
```

Then publish for real:
```bash
node publish-drafts.js --brand RIN --date 2026-05-12
```

**Check RIN accounts** (https://facebook.com/profile.php?id=61589010212907 + @roadside_intelligence on Instagram)

**Time**: 2 minutes

---

## ✅ Activation Complete

Once the test post appears on both platforms, you're live.

**Next**: Set up daily cron schedule (see RIN-SETUP-GUIDE.md for cron syntax).

---

## 📋 What Happens Daily (Going Forward)

**6:57 AM EST** → Daemon generates draft based on daily topic  
**You review** → Approve/edit in Supabase (or skip if auto-approve enabled)  
**9:00 AM EST** → Auto-publish to Facebook + Instagram  
**Log it** → Optional: track results in spreadsheet

---

## 🔗 Key Files

| File | Purpose |
|------|---------|
| `config-rin.json` | Publishing config (accounts, schedule, model) |
| `gtm-profile-rin.json` | Positioning & content pillars |
| `drafts/rin/` | Carousel drafts (YYYY-MM-DD format) |
| `RIN-SETUP-GUIDE.md` | Full setup reference |
| `RIN-ACTIVATION-CHECKLIST.md` | This checklist |

---

## ⚠️ Common Issues

**"Can't find Blotato account"**  
→ Re-authorize in Blotato Settings

**"Supabase insert error"**  
→ Check environment variables: `echo $SUPABASE_URL`

**"Post not appearing on Instagram"**  
→ Instagram account must be Business Account, not Creator Account

**"Daemon doesn't run at cron time"**  
→ Check timezone in config (currently "America/Toronto")

---

## 📞 Questions?

See: `RIN-SETUP-GUIDE.md` → Troubleshooting section

---

**Ready? Run the 5 steps above.** Takes 5 minutes to activate, 30 for first test.

Report back when the test post appears on RIN accounts. ✅
