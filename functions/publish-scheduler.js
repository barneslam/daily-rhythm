require("dotenv").config();

const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const BLOTATO_URL = "https://backend.blotato.com/v2/posts";
const SUPABASE_STORAGE_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public/graphics`;

const channelMap = {
  the_strategy_pitch: { linkedinPageId: "103704197" },
  barneslam_co:       { linkedinPageId: null },
  axis_chamber:       { linkedinPageId: "112398033" },
};
const LINKEDIN_ACCOUNT_ID = "17347";
const INSTAGRAM_ACCOUNT_ID = "40098";

async function blotatoPost(apiKey, payload) {
  const res = await fetch(BLOTATO_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "blotato-api-key": apiKey },
    body: JSON.stringify({ post: payload }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Blotato ${res.status}: ${err}`);
  }
  return res.json();
}

async function publishScheduledContent() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`📅 Publish-scheduler running for ${today}`);

  const { data: drafts, error } = await supabase
    .from("gtm_drafts")
    .select("*")
    .eq("draft_date", today)
    .eq("status", "approved");

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  if (!drafts || drafts.length === 0) {
    console.log("⏭️  No approved drafts for today");
    return { statusCode: 200, body: JSON.stringify({ message: "No drafts to publish today", date: today }) };
  }

  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "BLOTATO_API_KEY not set" }) };
  }

  console.log(`📤 Publishing ${drafts.length} post(s) for ${today}`);
  const results = [];

  for (const draft of drafts) {
    const scheduledTime = `${today}T14:00:00Z`;
    const channel = channelMap[draft.channel] || {};
    const graphicUrl = `${SUPABASE_STORAGE_URL}/${draft.channel}-${today}.png`;
    const mediaUrls = [graphicUrl];

    const linkedinTarget = { targetType: "linkedin" };
    if (channel.linkedinPageId) linkedinTarget.pageId = channel.linkedinPageId;

    const draftResults = [];

    try {
      await blotatoPost(apiKey, {
        accountId: LINKEDIN_ACCOUNT_ID,
        target: linkedinTarget,
        content: { text: draft.content, platform: "linkedin", mediaUrls },
        scheduledTime,
      });
      draftResults.push({ platform: "linkedin", status: "scheduled" });
    } catch (err) {
      draftResults.push({ platform: "linkedin", status: "failed", error: err.message });
    }

    try {
      await blotatoPost(apiKey, {
        accountId: INSTAGRAM_ACCOUNT_ID,
        target: { targetType: "instagram" },
        content: { text: draft.content, platform: "instagram", mediaUrls },
        scheduledTime,
      });
      draftResults.push({ platform: "instagram", status: "scheduled" });
    } catch (err) {
      draftResults.push({ platform: "instagram", status: "failed", error: err.message });
    }

    const anySuccess = draftResults.some(r => r.status === "scheduled");
    if (anySuccess) {
      await supabase
        .from("gtm_drafts")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", draft.id);
      console.log(`  ✓ Scheduled: ${draft.channel}`);
    } else {
      console.log(`  ❌ Failed: ${draft.channel}`);
    }

    results.push({ channel: draft.channel, platforms: draftResults });
  }

  const published = results.filter(r => r.platforms.some(p => p.status === "scheduled")).length;
  const failed = results.filter(r => r.platforms.every(p => p.status === "failed")).length;
  console.log(`\n✅ Done — ${published} scheduled, ${failed} failed`);

  return { statusCode: 200, body: JSON.stringify({ date: today, published, failed, results }) };
}

exports.handler = async (event, context) => {
  return await publishScheduledContent();
};
