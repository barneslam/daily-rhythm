/**
 * LinkedIn DM Webhook Handler
 * Receives incoming DMs from Blotato and stores them in Supabase for qualification
 */

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const webhookSecret = process.env.LINKEDIN_WEBHOOK_SECRET;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Validate webhook signature from Blotato
 */
function validateWebhookSignature(payload, signature) {
  if (!webhookSecret) {
    console.warn("⚠️  LINKEDIN_WEBHOOK_SECRET not configured - skipping signature validation");
    return true;
  }

  const hash = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(payload))
    .digest("hex");

  return hash === signature;
}

/**
 * Parse incoming DM payload and extract key fields
 */
function parseDMPayload(body) {
  return {
    conversationId: body.conversationId || body.conversation_id || "unknown",
    senderId: body.senderId || body.sender_id || "unknown",
    senderName: body.senderName || body.sender_name || "Unknown Sender",
    senderTitle: body.senderTitle || body.sender_title || null,
    senderCompany: body.senderCompany || body.sender_company || null,
    senderLinkedInUrl: body.senderLinkedInUrl || body.sender_linkedin_url || null,
    messageText: body.message?.text || body.message_text || "",
    messageTimestamp: body.message?.timestamp || body.message_timestamp || new Date().toISOString(),
    sourceChannel: body.sourcePost?.channel || body.source_channel || "unknown",
    sourcePostDate: body.sourcePost?.postDate || body.source_post_date || null,
    sourcePostTheme: body.sourcePost?.theme || body.source_post_theme || null,
  };
}

/**
 * Store DM in linkedin_dms table
 */
async function storeDM(dmData) {
  const { data, error } = await supabase
    .from("linkedin_dms")
    .insert([
      {
        conversation_id: dmData.conversationId,
        sender_id: dmData.senderId,
        sender_name: dmData.senderName,
        sender_title: dmData.senderTitle,
        sender_company: dmData.senderCompany,
        sender_linkedin_url: dmData.senderLinkedInUrl,
        message_text: dmData.messageText,
        source_channel: dmData.sourceChannel,
        source_post_date: dmData.sourcePostDate,
        source_post_theme: dmData.sourcePostTheme,
        received_at: dmData.messageTimestamp,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Failed to store DM:", error.message);
    throw new Error(`Database insert failed: ${error.message}`);
  }

  console.log(`✓ Stored DM from ${dmData.senderName} (conversation: ${dmData.conversationId})`);
  return data;
}

/**
 * Trigger qualification of the stored DM
 */
async function triggerQualification(dmRecord) {
  try {
    console.log(`📊 Triggering qualification for DM ID ${dmRecord.id}...`);

    // Import and call the qualify function
    const { qualifyDM } = require("./qualify-dm");
    const qualificationResult = await qualifyDM(dmRecord);

    return { queued: true, qualificationResult };
  } catch (error) {
    console.error("⚠️  Qualification trigger failed:", error.message);
    return { queued: false, error: error.message };
  }
}

/**
 * Netlify Function Handler
 */
exports.handler = async (event, context) => {
  console.log("📨 Received webhook event");

  // Only accept POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON payload" }),
      };
    }

    // Validate signature if configured
    const signature = event.headers["x-blotato-signature"] || event.headers["X-Blotato-Signature"];
    if (signature && !validateWebhookSignature(body, signature)) {
      console.error("❌ Webhook signature validation failed");
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    // Parse and validate DM payload
    const dmData = parseDMPayload(body);

    if (!dmData.conversationId || !dmData.senderName || !dmData.messageText) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields: conversationId, senderName, messageText",
        }),
      };
    }

    // Store DM in database
    const dmRecord = await storeDM(dmData);

    // Trigger async qualification
    const qualificationResult = await triggerQualification(dmRecord);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        dmId: dmRecord.id,
        conversationId: dmRecord.conversation_id,
        qualificationQueued: qualificationResult.queued,
      }),
    };
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
