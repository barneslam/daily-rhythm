# RIN Publishing Pipeline — Netlify Environment Setup

## Step 1: Set Netlify Environment Variables

Add these to your Netlify site settings:

**Netlify Admin → Site Settings → Build & Deploy → Environment**

```
SUPABASE_URL_RIN = https://zyoszbmahxnfcokuzkuv.supabase.co
SUPABASE_ANON_KEY_RIN = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3N6Ym1haHhuZmNva3V6a3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU3OTMsImV4cCI6MjA4OTA4MTc5M30.Ilz4RYTcgZU3IMnABg0eV7iAfFcC0iykyl4DOln-mjY
BLOTATO_API_KEY = blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=
```

## Configuration

**Account IDs in config-rin.json:**
- Instagram: `45382`
- Facebook: `1055037511034719` (page ID)

## Status

✅ **Instagram**: Publishing successfully (account ID: 45382)
✅ **Facebook**: Publishing successfully (account ID: 30406, page ID: 1055037511034719)

## Local Testing

```bash
# Sync drafts
export SUPABASE_URL_RIN='https://zyoszbmahxnfcokuzkuv.supabase.co'
export SUPABASE_ANON_KEY_RIN='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5b3N6Ym1haHhuZmNva3V6a3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU3OTMsImV4cCI6MjA4OTA4MTc5M30.Ilz4RYTcgZU3IMnABg0eV7iAfFcC0iykyl4DOln-mjY'
node sync-drafts-to-supabase.js rin

# Publish to Instagram
export BLOTATO_API_KEY='blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8='
node publish-drafts-v2.js rin 2026-05-11
```

## Architecture

- **Supabase**: Separate instance for RIN (`zyoszbmahxnfcokuzkuv` with RIN carousels in `gtm_drafts`)
- **Blotato**: Single API key, multiple accountIds for brands
- **Publishing**: `publish-drafts-v2.js` loads brand config, queries Supabase, publishes to Blotato

## Next Steps

1. ✅ RIN Supabase configured
2. ✅ RIN carousels created (2026-05-04, 2026-05-11)
3. ✅ Instagram publishing working
4. ⏳ Debug/reconnect Facebook in Blotato
5. ⏳ Verify Netlify env vars deployed
6. ⏳ Set up daily cron job for RIN publishing
