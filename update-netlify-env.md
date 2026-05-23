# Netlify Environment Variable Update

## New Blotato API Key
The previous BLOTATO_API_KEY has expired. Replace it with:

```
blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=
```

## Steps to Update in Netlify Dashboard

1. Go to: **Netlify Dashboard → Your Site → Site Settings → Build & Deploy → Environment**
2. Find the variable: `BLOTATO_API_KEY`
3. Update the value to the new key above
4. Save changes

## Verification

After updating, test that the publish-scheduler works:
- Check Netlify Functions log for `publish-scheduler`
- Look for successful Blotato API calls (should return 200 status)
- Verify posts appear on LinkedIn and Instagram within a few minutes

## Next Scheduled Publish
- **Time:** Weekdays at 9 AM EST (2 PM UTC)
- **Function:** `publish-scheduler`
- **Next run:** May 9, 2026 at 14:00 UTC (if today is before that date)

## Troubleshooting

If posts don't publish:
1. Check Netlify function logs for errors
2. Verify BLOTATO_API_KEY is set correctly (no extra spaces)
3. Confirm `gtm_drafts` table has approved posts with today's date
4. Check function timeout (set to 10 seconds minimum)
