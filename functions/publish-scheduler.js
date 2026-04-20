/**
 * Publish Scheduler — Automated publishing of approved drafts
 * Runs daily at 09:00 UTC (Mon-Fri) to publish that day's content
 * Reads approved drafts from Supabase gtm_drafts table
 */

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const channelMap = {
  the_strategy_pitch: { accountId: "17347", pageId: "103704197" },
  barneslam_co:       { accountId: "17347", pageId: null },
  axis_chamber:       { accountId: "17347", pageId: "112398033" },
};

async function publishScheduledContent() {
  const today = new Date().toISOString().split("T")[0];

  console.log(`📅 Publish-scheduler running for ${today}`);

  // Fetch today's approved drafts from Supabase
  const { data: drafts, error } = await supabase
    .from("gtm_drafts")
    .select("*")
    .eq("draft_date", today)
    .eq("status", "approved");

  if (error) {
    console.error("❌ Failed to fetch drafts from Supabase:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  if (!drafts || drafts.length === 0) {
    console.log("⏭️  No approved drafts found for today");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "No drafts to publish today", date: today }),
    };
  }

  console.log(`📤 Publishing ${drafts.length} post(s) for ${today}`);

  const results = [];

  for (const draft of drafts) {
    const channel = channelMap[draft.channel] || { accountId: "17347", pageId: null };

    try {
      const blotatoKey = process.env.BLOTATO_API_KEY;
      if (!blotatoKey) throw new Error("BLOTATO_API_KEY not set in environment");

      const payload = {
        accountId: channel.accountId,
        platform: "linkedin",
        text: draft.content,
        scheduledTime: `${today}T14:00:00Z`,
        mediaUrls: [],
      };
      if (channel.pageId) payload.pageId = channel.pageId;

      const response = await fetch("https://backend.blotato.com/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "blotato-api-key": blotatoKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Blotato error ${response.status}: ${errText}`);
      }

      // Mark as published in Supabase
      await supabase
        .from("gtm_drafts")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", draft.id);

      console.log(`  ✓ Published: ${draft.channel} (${draft.title})`);
      results.push({ channel: draft.channel, status: "published" });
    } catch (err) {
      console.error(`  ❌ Failed: ${draft.channel} — ${err.message}`);
      results.push({ channel: draft.channel, status: "failed", error: err.message });
    }
  }

  const published = results.filter((r) => r.status === "published").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n✅ Done — ${published} published, ${failed} failed`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      date: today,
      published,
      failed,
      results,
    }),
  };
}

// Netlify Scheduled Function
exports.handler = async (event, context) => {
  return await publishScheduledContent();
};
