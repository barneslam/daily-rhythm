/**
 * LinkedIn Webhook Handler — Receive inbound DMs from Blotato
 * Validates webhook signature, parses DM payload, stores in linkedin_dms table
 */

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Validate Blotato webhook signature
 * Blotato sends: X-Blotato-Signature header with HMAC-SHA256(body, secret)
 */
function validateWebhookSignature(body, signature, secret) {
  if (!secret) {
    console.warn("⚠️  No webhook secret configured, skipping signature validation");
    return true; // Allow if secret not configured (for testing)
  }

  const hash = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const isValid = hash === signature;
  if (!isValid) {
    console.error("❌ Webhook signature validation failed");
  }
  return isValid;
}

/**
 * Parse incoming DM payload from Blotato
 * Expected format:
 * {
 *   conversationId: "...",
 *   senderId: "...",
 *   senderName: "John Doe",
 *   senderTitle: "VP Sales",
 *   senderCompany: "Acme Corp",
 *   message: {
 *     text: "Hi, interested in your GTM platform",
 *     timestamp: "2026-04-15T09:30:00Z"
 *   },
 *   sourceChannel: "the_strategy_pitch",
 *   sourcePost: {
 *     date: "2026-04-15",
 *     theme: "GTM psychology"
 *   }
 * }
 */
function parseDMPayload(payload) {
  const message = payload.message || {};

  return {
    conversation_id: payload.conversationId || payload.conversation_id,
    sender_id: payload.senderId || payload.sender_id,
    sender_name: payload.senderName || payload.sender_name || "Unknown",
    sender_title: payload.senderTitle || payload.sender_title || null,
    sender_company: payload.senderCompany || payload.sender_company || null,
    sender_linkedin_url: payload.senderLinkedInUrl || payload.sender_linkedin_url || null,
    message_text: message.text || message.message || "",
    source_channel: payload.sourceChannel || payload.source_channel || "unknown",
    source_post_date: payload.sourcePost?.date || payload.source_post_date || null,
    source_post_theme: payload.sourcePost?.theme || payload.source_post_theme || null,
    received_at: message.timestamp || payload.timestamp || new Date().toISOString(),
  };
}

/**
 * Auto-qualify a LinkedIn DM based on sender signals
 */
function autoQualifyDM(dmRecord) {
  let titleScore = 0;
  let intentScore = 0;
  let companyScore = 0;
  let notes = [];

  // Title signals (0-1)
  const seniorTitles = [
    "ceo",
    "cfo",
    "cro",
    "cto",
    "vp",
    "president",
    "founder",
    "director",
  ];
  const hasTitle = dmRecord.sender_title
    ? seniorTitles.some((t) =>
        dmRecord.sender_title.toLowerCase().includes(t)
      )
    : false;
  titleScore = hasTitle ? 1.0 : 0.4;
  if (hasTitle) notes.push("Senior title detected");

  // Intent signals from message text (0-1)
  const intentKeywords = [
    "interested",
    "question",
    "need",
    "can we",
    "available",
    "connect",
    "gtm",
    "sales",
    "pipeline",
  ];
  const hasIntent = intentKeywords.some((k) =>
    dmRecord.message_text.toLowerCase().includes(k)
  );
  intentScore = hasIntent ? 0.8 : 0.3;
  if (hasIntent) notes.push("High-intent keywords found");

  // Company signals (0-1)
  const hasCompany =
    dmRecord.sender_company && dmRecord.sender_company.length > 0;
  companyScore = hasCompany ? 0.7 : 0.4;
  if (hasCompany) notes.push(`Company: ${dmRecord.sender_company}`);

  // Weighted qualification score
  const qualificationScore =
    titleScore * 0.3 + intentScore * 0.5 + companyScore * 0.2;
  const autoQualified = qualificationScore >= 0.6;

  return {
    qualificationScore,
    autoQualified,
    qualificationNotes: notes.join(" | "),
  };
}

/**
 * Store DM in Supabase, avoiding duplicates
 */
async function storeDMInSupabase(dmRecord) {
  try {
    // Check if this conversation already exists
    const { data: existing } = await supabase
      .from("linkedin_dms")
      .select("id, received_at")
      .eq("conversation_id", dmRecord.conversation_id)
      .single();

    if (existing && existing.received_at) {
      console.log(
        `ℹ️  Conversation ${dmRecord.conversation_id} already stored, skipping`
      );
      return {
        stored: false,
        reason: "duplicate",
        existingId: existing.id,
      };
    }

    // Auto-qualify the DM
    const qualification = autoQualifyDM(dmRecord);

    // Insert new DM record
    const recordToInsert = {
      ...dmRecord,
      auto_qualified: qualification.autoQualified,
      qualification_score: qualification.qualificationScore,
      qualification_notes: qualification.qualificationNotes,
      lead_status: "new",
    };

    const { data: inserted, error: insertError } = await supabase
      .from("linkedin_dms")
      .insert([recordToInsert])
      .select();

    if (insertError) {
      console.error(`❌ Failed to insert DM:`, insertError.message);
      return {
        stored: false,
        error: insertError.message,
      };
    }

    console.log(`✓ Stored DM from ${dmRecord.sender_name}`);
    console.log(
      `  Qualification: ${qualification.qualificationScore.toFixed(2)} ${
        qualification.autoQualified ? "✓ QUALIFIED" : "✗ NOT QUALIFIED"
      }`
    );

    return {
      stored: true,
      id: inserted[0].id,
      qualification,
    };
  } catch (error) {
    console.error("❌ Error storing DM:", error.message);
    return {
      stored: false,
      error: error.message,
    };
  }
}

/**
 * Main webhook handler
 */
exports.handler = async (event) => {
  console.log("📨 Webhook received");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Parse request body
    const body = event.body;
    const payload = typeof body === "string" ? JSON.parse(body) : body;

    // Validate webhook signature (optional if secret not configured)
    const signature = event.headers["x-blotato-signature"] || event.headers["X-Blotato-Signature"];
    const secret = process.env.LINKEDIN_WEBHOOK_SECRET;

    if (signature && !validateWebhookSignature(body, signature, secret)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid webhook signature" }),
      };
    }

    // Parse DM payload
    const dmRecord = parseDMPayload(payload);

    if (!dmRecord.conversation_id) {
      console.error("❌ Missing conversation_id in payload");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing conversation_id" }),
      };
    }

    // Store in Supabase
    const result = await storeDMInSupabase(dmRecord);

    if (!result.stored) {
      // Return 200 even if duplicate or error (webhook should succeed)
      return {
        statusCode: 200,
        body: JSON.stringify({
          received: true,
          stored: false,
          reason: result.reason || result.error,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        received: true,
        stored: true,
        id: result.id,
        qualification: result.qualification,
      }),
    };
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    return {
      statusCode: 200, // Return 200 so Blotato doesn't retry
      body: JSON.stringify({
        received: true,
        stored: false,
        error: error.message,
      }),
    };
  }
};
