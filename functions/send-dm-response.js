/**
 * Send DM Response — Generate warm response and schedule for send
 * POST /.netlify/functions/send-dm-response
 * Body: { dm_id: BIGINT, manual_trigger: BOOLEAN }
 */

const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Fetch DM record from linkedin_dms table
 */
async function fetchDMRecord(dmId) {
  try {
    const { data, error } = await supabase
      .from("linkedin_dms")
      .select(
        "id, sender_name, sender_company, message_text, source_post_theme, lead_status"
      )
      .eq("id", dmId)
      .single();

    if (error) {
      console.error(`❌ Failed to fetch DM ${dmId}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("❌ Error fetching DM record:", error.message);
    return null;
  }
}

/**
 * Check if response already exists for this DM
 */
async function checkExistingOutreach(dmId) {
  try {
    const { data, error } = await supabase
      .from("dm_outreach")
      .select("id")
      .eq("dm_id", dmId)
      .single();

    if (error && error.code === "PGRST116") {
      // Not found, which is expected
      return null;
    }

    if (error) {
      console.error("❌ Error checking existing outreach:", error.message);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error("❌ Error in checkExistingOutreach:", error.message);
    return null;
  }
}

/**
 * Generate warm response via regen-message function
 */
async function generateWarmResponse(dmRecord, webhookUrl) {
  try {
    const payload = {
      message: {
        _stage: "warm",
        name: dmRecord.sender_name,
        business: dmRecord.sender_company || "their company",
        subject: `Re: ${dmRecord.source_post_theme || "Your message"}`,
        full_body: dmRecord.message_text,
      },
    };

    console.log(`📤 Calling regen-message with payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(`${webhookUrl}/.netlify/functions/regen-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ regen-message returned ${response.status}`);
      return null;
    }

    const result = await response.json();
    console.log(`✓ Generated warm response:`, result);

    return {
      subject: result.subject,
      body: result.body,
    };
  } catch (error) {
    console.error("❌ Error generating warm response:", error.message);
    return null;
  }
}

/**
 * Create outreach record in dm_outreach table
 */
async function createOutreachRecord(dmRecord, message) {
  try {
    const { data, error } = await supabase
      .from("dm_outreach")
      .insert([
        {
          dm_id: dmRecord.id,
          sender_name: dmRecord.sender_name,
          sender_company: dmRecord.sender_company,
          subject: message.subject,
          body: message.body,
          send_date: new Date().toISOString().split("T")[0],
          status: "scheduled",
        },
      ])
      .select();

    if (error) {
      console.error("❌ Failed to insert outreach record:", error.message);
      return null;
    }

    console.log(`✓ Created outreach record:`, data[0].id);
    return data[0];
  } catch (error) {
    console.error("❌ Error creating outreach record:", error.message);
    return null;
  }
}

/**
 * Update DM status to "responded"
 */
async function updateDMStatus(dmId) {
  try {
    const { error } = await supabase
      .from("linkedin_dms")
      .update({
        lead_status: "responded",
        next_action: "awaiting_reply",
        updated_at: new Date().toISOString(),
      })
      .eq("id", dmId);

    if (error) {
      console.error("❌ Failed to update DM status:", error.message);
      return false;
    }

    console.log(`✓ Updated DM ${dmId} status to "responded"`);
    return true;
  } catch (error) {
    console.error("❌ Error updating DM status:", error.message);
    return false;
  }
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  console.log("📤 Send DM Response handler called");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Use POST to send response" }),
    };
  }

  try {
    // Parse request body
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    const { dm_id, manual_trigger } = body;

    if (!dm_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing dm_id" }),
      };
    }

    console.log(`📋 Processing DM ${dm_id} (manual: ${manual_trigger || false})`);

    // Fetch DM record
    const dmRecord = await fetchDMRecord(dm_id);
    if (!dmRecord) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `DM ${dm_id} not found` }),
      };
    }

    // Check for existing outreach
    const existingOutreach = await checkExistingOutreach(dm_id);
    if (existingOutreach) {
      console.log(`ℹ️  Response already exists for DM ${dm_id}`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          created: false,
          reason: "response_already_scheduled",
          existing_id: existingOutreach,
        }),
      };
    }

    // Determine webhook URL
    let webhookUrl;
    if (event.headers.host) {
      const protocol = event.headers["x-forwarded-proto"] || "https";
      webhookUrl = `${protocol}://${event.headers.host}`;
    } else {
      webhookUrl = "http://localhost:8888";
    }

    // Generate warm response
    const message = await generateWarmResponse(dmRecord, webhookUrl);
    if (!message) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to generate response" }),
      };
    }

    // Create outreach record
    const outreach = await createOutreachRecord(dmRecord, message);
    if (!outreach) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to create outreach record" }),
      };
    }

    // Update DM status
    const statusUpdated = await updateDMStatus(dm_id);
    if (!statusUpdated) {
      console.warn("⚠️  DM status update failed, but outreach record created");
    }

    console.log(`✓ Response created and scheduled for DM ${dm_id}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        created: true,
        response_id: outreach.id,
        message: {
          subject: message.subject,
          body: message.body,
        },
        scheduled_for: outreach.send_date,
        manual_trigger,
      }),
    };
  } catch (error) {
    console.error("❌ Send DM Response error:", error.message);
    return {
      statusCode: 200,
      body: JSON.stringify({
        created: false,
        error: error.message,
      }),
    };
  }
};
