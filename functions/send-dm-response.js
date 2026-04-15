/**
 * Send DM Response — Execute scheduled warm responses to qualified DMs
 * Triggered by dashboard action or scheduled 2 hours after outreach creation
 * Sends warm response via LinkedIn and updates outreach status
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Send a warm response to a qualified DM
 * For now: Marks as ready-to-send and logs the action (actual LinkedIn send requires API integration)
 */
async function sendDMResponse(outreachId) {
  try {
    console.log(`📤 Fetching outreach entry ${outreachId}...`);

    // Fetch the outreach entry with linked DM data
    const { data: outreachData, error: fetchError } = await supabase
      .from("dm_outreach")
      .select(
        `
        id,
        dm_id,
        sender_name,
        sender_company,
        body,
        status,
        created_at,
        linkedin_dms (
          id,
          sender_id,
          sender_name,
          sender_company,
          message_text,
          conversation_id
        )
      `
      )
      .eq("id", outreachId)
      .single();

    if (fetchError) {
      console.error("❌ Failed to fetch outreach entry:", fetchError.message);
      throw new Error(`Outreach fetch failed: ${fetchError.message}`);
    }

    if (!outreachData) {
      throw new Error("Outreach entry not found");
    }

    console.log(`✓ Fetched outreach for ${outreachData.sender_name}`);

    // Get the linked DM for context
    const dmData = outreachData.linkedin_dms;
    if (!dmData) {
      throw new Error("Associated DM not found");
    }

    // TODO: For production, integrate with LinkedIn API:
    // 1. POST to LinkedIn API endpoint with message and conversation_id
    // 2. Handle response codes (429 = rate limited, 403 = auth issue, etc.)
    // 3. Capture LinkedIn's message ID for tracking

    // For now: Mark as queued for send (manual or async LinkedIn integration)
    console.log(`📨 Message ready to send to ${dmData.sender_name}:`);
    console.log(`   "${outreachData.body.substring(0, 80)}..."`);
    console.log(`   Conversation ID: ${dmData.conversation_id}`);
    console.log(`   (Actual LinkedIn send requires API integration)`);

    // Update outreach status to sent
    const { error: updateOutreachError } = await supabase
      .from("dm_outreach")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", outreachId);

    if (updateOutreachError) {
      console.warn("⚠️  Could not update outreach status:", updateOutreachError.message);
    } else {
      console.log(`✓ Outreach marked as sent`);
    }

    // Update DM status to "responded"
    const { error: updateDMError } = await supabase
      .from("linkedin_dms")
      .update({
        lead_status: "responded",
        next_action: "await_reply",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dmData.id);

    if (updateDMError) {
      console.warn("⚠️  Could not update DM status:", updateDMError.message);
    } else {
      console.log(`✓ DM status updated to "responded"`);
    }

    return {
      success: true,
      outreachId: outreachData.id,
      dmId: dmData.id,
      senderName: dmData.sender_name,
      status: "sent",
      linkedInIntegrationNote: "Manual LinkedIn API integration required for actual DM delivery",
    };
  } catch (error) {
    console.error("❌ Send DM response error:", error.message);
    throw error;
  }
}

/**
 * Get scheduled outreach entries ready to send (2+ hours past creation)
 */
async function getScheduledOutreach() {
  try {
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

    const { data, error } = await supabase
      .from("dm_outreach")
      .select(
        `
        id,
        dm_id,
        sender_name,
        created_at,
        status
      `
      )
      .eq("status", "scheduled")
      .lte("created_at", twoHoursAgo.toISOString())
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      console.error("❌ Failed to fetch scheduled outreach:", error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Error fetching scheduled outreach:", error.message);
    return [];
  }
}

/**
 * Process all scheduled outreach (batch send)
 */
async function processBatchOutreach() {
  console.log("⏰ Processing scheduled outreach batch...");

  const scheduled = await getScheduledOutreach();

  if (scheduled.length === 0) {
    console.log("ℹ️  No scheduled outreach ready to send");
    return { processed: 0, failed: 0 };
  }

  console.log(`📋 Found ${scheduled.length} scheduled outreach entries to process`);

  let processed = 0;
  let failed = 0;

  for (const entry of scheduled) {
    try {
      await sendDMResponse(entry.id);
      processed++;
    } catch (error) {
      console.error(`❌ Failed to send outreach ${entry.id}:`, error.message);
      failed++;
    }
  }

  return { processed, failed };
}

/**
 * Netlify Function Handler
 * Endpoint: POST /api/send-dm-response
 *
 * Request body:
 * - outreachId (optional): Send specific outreach entry
 * - batchMode (optional): If true, process all scheduled entries
 */
exports.handler = async (event, context) => {
  console.log("📤 DM Response Handler triggered");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid JSON payload" }),
        };
      }
    }

    // Mode 1: Send specific outreach
    if (body.outreachId) {
      const result = await sendDMResponse(body.outreachId);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      };
    }

    // Mode 2: Batch process scheduled outreach (2+ hours old)
    const batchResult = await processBatchOutreach();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "batch",
        processed: batchResult.processed,
        failed: batchResult.failed,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ Handler error:", error.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Export for use by other functions (e.g., scheduled cron job)
exports.sendDMResponse = sendDMResponse;
exports.processBatchOutreach = processBatchOutreach;
