require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const brandMap = {
  the_strategy_pitch: "The Strategy Pitch",
  barneslam_co:       "BarnesLam.co",
  axis_chamber:       "Axis Chamber",
};

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

  console.log(`📤 Publishing ${drafts.length} post(s) for ${today}`);
  const results = [];

  for (const draft of drafts) {
    const blotatoKey = process.env.BLOTATO_API_KEY;
    if (!blotatoKey) {
      results.push({ channel: draft.channel, status: "failed", error: "BLOTATO_API_KEY not set" });
      continue;
    }

    const brand = brandMap[draft.channel] || "BarnesLam.co";
    const graphicUrl = `https://daily-lead-gen-track.netlify.app/api/graphic-png?file=${draft.channel}-${today}`;

    try {
      const response = await fetch("https://api.blotato.com/v1/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${blotatoKey}`,
        },
        body: JSON.stringify({
          platforms: ["linkedin", "instagram"],
          content: draft.content,
          scheduled_at: `${today}T14:00:00Z`,
          brand,
          media_urls: [graphicUrl],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Blotato ${response.status}: ${errText}`);
      }

      await supabase
        .from("gtm_drafts")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", draft.id);

      console.log(`  ✓ Published: ${draft.channel}`);
      results.push({ channel: draft.channel, status: "published" });
    } catch (err) {
      console.error(`  ❌ Failed: ${draft.channel} — ${err.message}`);
      results.push({ channel: draft.channel, status: "failed", error: err.message });
    }
  }

  const published = results.filter((r) => r.status === "published").length;
  const failed = results.filter((r) => r.status === "failed").length;
  console.log(`\n✅ Done — ${published} published, ${failed} failed`);

  return { statusCode: 200, body: JSON.stringify({ date: today, published, failed, results }) };
}

exports.handler = async (event, context) => {
  return await publishScheduledContent();
};
