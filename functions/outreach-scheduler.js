/**
 * Outreach Scheduler — Automated batch processor for scheduled DM responses
 * Runs every 30 minutes via Netlify scheduled function
 * Finds DM outreach scheduled 2+ hours ago and marks them as sent
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Cron handler: Process all scheduled outreach ready to send
 */
exports.handler = async (event, context) => {
  console.log("⏰ [CRON] Outreach Scheduler running...");

  try {
    // Find outreach scheduled 2+ hours ago
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { data: scheduled, error: fetchError } = await supabase
      .from("dm_outreach")
      .select("id, sender_name, send_date, created_at")
      .eq("status", "scheduled")
      .lte("created_at", twoHoursAgo.toISOString())
      .order("created_at", { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error("❌ Failed to fetch scheduled outreach:", fetchError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: fetchError.message }),
      };
    }

    if (!scheduled || scheduled.length === 0) {
      console.log("ℹ️  No outreach ready to send");
      return {
        statusCode: 200,
        body: JSON.stringify({ processed: 0, message: "No outreach ready" }),
      };
    }

    console.log(`📋 Found ${scheduled.length} outreach entries to process`);

    // Process each outreach entry
    let processed = 0;
    let failed = 0;

    for (const entry of scheduled) {
      try {
        const { error: updateError } = await supabase
          .from("dm_outreach")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        if (updateError) {
          console.warn(`⚠️  Failed to update outreach ${entry.id}:`, updateError.message);
          failed++;
          continue;
        }

        // Also update the linked DM status
        const { data: dmLink } = await supabase
          .from("dm_outreach")
          .select("dm_id")
          .eq("id", entry.id)
          .single();

        if (dmLink) {
          await supabase
            .from("linkedin_dms")
            .update({
              lead_status: "responded",
              next_action: "await_reply",
              updated_at: new Date().toISOString(),
            })
            .eq("id", dmLink.dm_id);
        }

        console.log(`✓ Processed outreach for ${entry.sender_name} (ID: ${entry.id})`);
        processed++;
      } catch (error) {
        console.error(`❌ Error processing outreach ${entry.id}:`, error.message);
        failed++;
      }
    }

    console.log(`📊 Batch complete: ${processed} sent, ${failed} failed`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        processed,
        failed,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Scheduler error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
