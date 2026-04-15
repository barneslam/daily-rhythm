/**
 * Blotato DM Poller — Poll Blotato API for inbound DMs every 30 minutes
 * Runs via scheduled Netlify function in netlify.toml
 * Fetches new conversations and stores them in linkedin_dms table
 */

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BLOTATO_API_BASE = "https://backend.blotato.com";
const BLOTATO_API_KEY = process.env.BLOTATO_API_KEY;

/**
 * Fetch inbound conversations from Blotato API
 * Returns array of conversation objects with messages
 */
async function fetchBlotatoConversations() {
  try {
    console.log("📨 Fetching conversations from Blotato API...");

    // Try to fetch conversations endpoint
    // Blotato API may have: /conversations, /messages, or /accounts/{id}/conversations
    const response = await fetch(`${BLOTATO_API_BASE}/conversations`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "blotato-api-key": BLOTATO_API_KEY,
      },
    });

    if (!response.ok) {
      // If /conversations fails, try alternative endpoint
      if (response.status === 404) {
        console.log(
          "⚠️  /conversations endpoint not found, trying /messages..."
        );
        return await fetchFromAlternativeEndpoint();
      }
      throw new Error(
        `Blotato API error ${response.status}: ${await response.text()}`
      );
    }

    const data = await response.json();
    console.log(`✓ Fetched ${data.conversations?.length || 0} conversations`);
    return data.conversations || [];
  } catch (error) {
    console.error("❌ Error fetching from Blotato API:", error.message);
    return [];
  }
}

/**
 * Try alternative Blotato API endpoints if primary fails
 */
async function fetchFromAlternativeEndpoint() {
  try {
    // Try /messages endpoint
    const response = await fetch(`${BLOTATO_API_BASE}/messages`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "blotato-api-key": BLOTATO_API_KEY,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Fetched ${data.messages?.length || 0} messages`);
      return data.messages || [];
    }

    return [];
  } catch (error) {
    console.error("❌ Alternative endpoint also failed:", error.message);
    return [];
  }
}

/**
 * Parse Blotato conversation into linkedin_dms record
 */
function parseBlotatoConversation(conversation) {
  // Blotato conversation structure (inferred from DM webhook)
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];

  if (!lastMessage) return null;

  return {
    conversation_id: conversation.id || conversation.conversationId,
    sender_id: conversation.senderId || lastMessage.senderId,
    sender_name: conversation.senderName || lastMessage.senderName || "Unknown",
    sender_title: conversation.senderTitle || lastMessage.senderTitle || null,
    sender_company: conversation.senderCompany || lastMessage.senderCompany || null,
    sender_linkedin_url: conversation.senderLinkedInUrl || null,
    message_text: lastMessage.text || lastMessage.message || "",
    source_channel:
      conversation.sourceChannel ||
      conversation.sourcePost?.channel ||
      "unknown",
    source_post_date: conversation.sourcePost?.date || null,
    source_post_theme: conversation.sourcePost?.theme || null,
    received_at: lastMessage.timestamp || conversation.lastMessageDate,
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
    ? seniorTitles.some((t) => dmRecord.sender_title.toLowerCase().includes(t))
    : false;
  titleScore = hasTitle ? 1.0 : 0.4;
  if (hasTitle) notes.push("Senior title detected");

  // Intent signals from message text (0-1)
  const intentKeywords = ["interested", "question", "need", "can we", "available", "connect"];
  const hasIntent = intentKeywords.some((k) =>
    dmRecord.message_text.toLowerCase().includes(k)
  );
  intentScore = hasIntent ? 0.8 : 0.3;
  if (hasIntent) notes.push("High-intent keywords found");

  // Company signals (0-1) — if company exists, higher score
  const hasCompany = dmRecord.sender_company && dmRecord.sender_company.length > 0;
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
    const { data: existing, error: checkError } = await supabase
      .from("linkedin_dms")
      .select("id, received_at")
      .eq("conversation_id", dmRecord.conversation_id)
      .single();

    if (existing && existing.received_at) {
      console.log(
        `  ⏭️  Conversation ${dmRecord.conversation_id} already stored, skipping`
      );
      return null;
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
      console.error(`  ❌ Failed to insert DM:`, insertError.message);
      return null;
    }

    console.log(`  ✓ Stored DM from ${dmRecord.sender_name}`);
    console.log(
      `    Qualification: ${qualification.qualificationScore.toFixed(2)} ${qualification.autoQualified ? "✓ QUALIFIED" : "✗ NOT QUALIFIED"}`
    );

    return inserted[0];
  } catch (error) {
    console.error("❌ Error storing DM:", error.message);
    return null;
  }
}

/**
 * Main polling function
 */
async function pollBlotatoDMs() {
  console.log("⏰ Starting Blotato DM polling...");

  if (!BLOTATO_API_KEY) {
    console.error("❌ BLOTATO_API_KEY not set");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "BLOTATO_API_KEY not configured" }),
    };
  }

  // Fetch conversations from Blotato
  const conversations = await fetchBlotatoConversations();

  if (!conversations || conversations.length === 0) {
    console.log("ℹ️  No new conversations from Blotato");
    return {
      statusCode: 200,
      body: JSON.stringify({ processed: 0, stored: 0 }),
    };
  }

  console.log(`📋 Processing ${conversations.length} conversations`);

  let stored = 0;
  let skipped = 0;

  for (const conversation of conversations) {
    const dmRecord = parseBlotatoConversation(conversation);

    if (!dmRecord) {
      skipped++;
      continue;
    }

    const result = await storeDMInSupabase(dmRecord);
    if (result) {
      stored++;
    }
  }

  console.log(
    `📊 Polling complete: ${stored} stored, ${skipped} skipped/duplicates`
  );

  return {
    statusCode: 200,
    body: JSON.stringify({
      processed: conversations.length,
      stored,
      skipped,
      timestamp: new Date().toISOString(),
    }),
  };
}

/**
 * Netlify Scheduled Function Handler
 * Runs every 30 minutes via scheduled function in netlify.toml
 */
exports.handler = async (event, context) => {
  return await pollBlotatoDMs();
};

// Export for direct testing
exports.pollBlotatoDMs = pollBlotatoDMs;
