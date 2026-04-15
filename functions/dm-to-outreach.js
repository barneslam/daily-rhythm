/**
 * Phase 4: DM-to-Outreach Converter
 * Converts qualified LinkedIn DMs into the outreach pipeline
 * Triggered by linkedin-webhook.js after DM is stored
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Fetch full DM record from linkedin_dms table
 */
async function fetchDMRecord(dmId) {
  const { data, error } = await supabase
    .from("linkedin_dms")
    .select(
      "id, sender_name, sender_company, message_text, source_post_theme, auto_qualified, qualification_score"
    )
    .eq("id", dmId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch DM record: ${error.message}`);
  }
  return data;
}

/**
 * Check if dm_outreach already exists for this dm_id
 */
async function checkExistingOutreach(dmId) {
  const { data, error } = await supabase
    .from("dm_outreach")
    .select("id")
    .eq("dm_id", dmId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 means no rows found, which is expected
    throw new Error(`Failed to check existing outreach: ${error.message}`);
  }

  return data ? data.id : null;
}

/**
 * Generate warm response message via regen-message.js
 */
async function generateWarmResponse(dmRecord) {
  try {
    const response = await fetch(
      "https://daily-lead-gen-track.netlify.app/.netlify/functions/regen-message",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            _stage: "warm",
            name: dmRecord.sender_name,
            business: dmRecord.sender_company || "their company",
            subject: `Re: ${dmRecord.source_post_theme || "Your message"}`,
            full_body: dmRecord.message_text,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`regen-message returned ${response.status}`);
    }

    const result = await response.json();
    return {
      subject: result.subject,
      body: result.body,
    };
  } catch (error) {
    throw new Error(`Failed to generate warm response: ${error.message}`);
  }
}

/**
 * Create dm_outreach record
 */
async function createOutreachRecord(dmRecord, message) {
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
    throw new Error(`Failed to create outreach record: ${error.message}`);
  }

  return data[0];
}

/**
 * Update DM status to "contacted"
 */
async function updateDMStatus(dmId) {
  const { error } = await supabase
    .from("linkedin_dms")
    .update({
      lead_status: "contacted",
      next_action: "warm_response_sent",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dmId);

  if (error) {
    throw new Error(`Failed to update DM status: ${error.message}`);
  }
}

/**
 * Mark non-qualified DM as low_intent
 */
async function markAsLowIntent(dmId) {
  const { error } = await supabase
    .from("linkedin_dms")
    .update({
      lead_status: "low_intent",
      next_action: "no_response",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dmId);

  if (error) {
    throw new Error(`Failed to mark as low_intent: ${error.message}`);
  }
}

/**
 * Main handler: Convert DM to outreach
 */
exports.handler = async (event) => {
  console.log("📧 DM-to-Outreach converter started");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { dm_id, auto_qualified, qualification_score } = body;

    if (!dm_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing dm_id" }),
      };
    }

    // Fetch full DM record
    const dmRecord = await fetchDMRecord(dm_id);
    if (!dmRecord) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "DM not found" }),
      };
    }

    // Check for existing outreach
    const existingId = await checkExistingOutreach(dm_id);
    if (existingId) {
      console.log(
        `ℹ️  Outreach already exists for dm_id ${dm_id}: ${existingId}`
      );
      return {
        statusCode: 200,
        body: JSON.stringify({
          created: false,
          reason: "response_already_scheduled",
          existing_id: existingId,
        }),
      };
    }

    // Handle non-qualified DMs
    if (!auto_qualified || qualification_score < 0.6) {
      console.log(`ℹ️  DM ${dm_id} non-qualified (score: ${qualification_score})`);
      await markAsLowIntent(dm_id);
      return {
        statusCode: 200,
        body: JSON.stringify({
          created: false,
          reason: "non_qualified",
          qualification_score,
        }),
      };
    }

    // Generate warm response
    console.log(`📝 Generating warm response for ${dmRecord.sender_name}`);
    const message = await generateWarmResponse(dmRecord);

    // Create outreach record
    const outreach = await createOutreachRecord(dmRecord, message);
    console.log(`✓ Created outreach record: ${outreach.id}`);

    // Update DM status
    await updateDMStatus(dm_id);
    console.log(`✓ Updated DM ${dm_id} status to 'contacted'`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        created: true,
        dm_outreach_id: outreach.id,
        message: {
          subject: message.subject,
          body: message.body,
        },
        scheduled_for: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ DM-to-Outreach error:", error.message);
    return {
      statusCode: 200, // Return 200 to prevent retry
      body: JSON.stringify({
        created: false,
        error: error.message,
      }),
    };
  }
};
