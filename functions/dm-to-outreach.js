/**
 * DM to Outreach — Convert qualified DMs to warm outreach pipeline
 * Triggered by qualify-dm.js after DM is scored as qualified
 * Creates entry in outreach_messages and schedules warm response
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Generate a warm response message for qualified DM
 * Context: sender has already shown interest via DM, so tone is warm/conversational
 */
function generateWarmResponse(dmData) {
  const senderName = dmData.sender_name?.split(" ")[0] || "there"; // First name only
  const theme = dmData.source_post_theme || "GTM";
  const company = dmData.sender_company ? ` at ${dmData.sender_company}` : "";

  // Template-based warm response (can be enhanced with Claude API for personalization)
  const response = `Hi ${senderName},

Thanks for reaching out about our ${theme.toLowerCase()} post${company}.

I'd love to understand what specific challenge you're navigating right now. Is it around positioning, pricing, or go-to-market timing?

Let's jump on a quick call this week so I can see if there's a fit. What works for you?

Best,
Barnes`;

  return response;
}

/**
 * Create an outreach entry from a qualified DM
 */
async function convertDMtoOutreach(dmData) {
  try {
    console.log(`🔄 Converting qualified DM from ${dmData.sender_name} to outreach...`);

    // Generate warm response message
    const warmMessage = generateWarmResponse(dmData);

    // Calculate send date: 2 hours from now
    const sendDate = new Date();
    sendDate.setHours(sendDate.getHours() + 2);
    const sendDateStr = sendDate.toISOString().split("T")[0];

    // Create dm_outreach entry
    const { data, error } = await supabase
      .from("dm_outreach")
      .insert([
        {
          dm_id: dmData.id,
          sender_name: dmData.sender_name,
          sender_company: dmData.sender_company || "Unknown",
          subject: `Re: ${dmData.source_post_theme || "Your Post"}`,
          body: warmMessage,
          send_date: sendDateStr,
          status: "scheduled",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to create outreach entry:", error.message);
      throw new Error(`Outreach creation failed: ${error.message}`);
    }

    console.log(`✓ Created outreach entry ${data.id} for ${dmData.sender_name}`);
    console.log(`   Scheduled to send: ${sendDateStr}`);
    console.log(`   Message preview: ${warmMessage.substring(0, 50)}...`);

    // Update the linkedin_dms record to reference the outreach entry
    const { error: updateError } = await supabase
      .from("linkedin_dms")
      .update({
        lead_status: "contacted",
        next_action: "await_response",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dmData.id);

    if (updateError) {
      console.warn("⚠️  Could not update DM status:", updateError.message);
    }

    return {
      success: true,
      outreachId: data.id,
      messagePreview: warmMessage.substring(0, 100),
    };
  } catch (error) {
    console.error("❌ DM-to-outreach error:", error.message);
    throw error;
  }
}

/**
 * Netlify Function Handler (for manual trigger via API)
 */
exports.handler = async (event, context) => {
  console.log("🔄 Received DM-to-outreach request");

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

    if (!body.dmData || !body.dmData.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing dmData with id" }),
      };
    }

    const result = await convertDMtoOutreach(body.dmData);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("❌ Handler error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Export for use by other functions
exports.convertDMtoOutreach = convertDMtoOutreach;
