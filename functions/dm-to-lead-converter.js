/**
 * DM to Lead Converter — Process linkedin_dms and create gtm_targets leads
 * Runs every 60 minutes to batch-convert qualified DMs into leads
 */

require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Get unprocessed DMs from linkedin_dms table
 */
async function getUnprocessedDMs() {
  try {
    const { data, error } = await supabase
      .from("linkedin_dms")
      .select("*")
      .eq("lead_status", "new")
      .order("received_at", { ascending: true })
      .limit(50);

    if (error) throw error;

    console.log(`📬 Found ${data?.length || 0} unprocessed DMs`);
    return data || [];
  } catch (error) {
    console.error("❌ Error fetching unprocessed DMs:", error.message);
    return [];
  }
}

/**
 * Convert a linkedin_dm to a gtm_target lead
 */
async function convertDMToLead(dm) {
  try {
    // Skip if already converted (check for existing lead with same conversation_id)
    const { data: existing } = await supabase
      .from("gtm_targets")
      .select("id")
      .eq("source", "dm")
      .like("notes", `%${dm.conversation_id}%`)
      .single();

    if (existing) {
      console.log(`  ⏭️  Lead already exists for conversation ${dm.conversation_id}`);
      return null;
    }

    // Create lead record
    const leadData = {
      name: dm.sender_name || "Unknown",
      status: "dm_engaged",
      source: "dm",
      linkedin_url: dm.sender_linkedin_url || "",
      date_found: new Date().toISOString().split("T")[0],
      notes: `DM: "${dm.message_text.substring(0, 100)}" | From: ${dm.sender_company || "Unknown"} | Conv: ${dm.conversation_id}`,
      connection_note: dm.message_text,
      qualification_score: dm.qualification_score || 0.5,
    };

    // Insert into gtm_targets
    const { data: inserted, error } = await supabase
      .from("gtm_targets")
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error(`  ❌ Failed to create lead:`, error.message);
      return null;
    }

    console.log(`  ✓ Created lead: ${inserted.name} (score: ${leadData.qualification_score.toFixed(2)})`);

    // Mark DM as processed
    await supabase
      .from("linkedin_dms")
      .update({ lead_status: "converted", lead_id: inserted.id })
      .eq("id", dm.id);

    return inserted;
  } catch (error) {
    console.error("❌ Error converting DM to lead:", error.message);
    return null;
  }
}

/**
 * Main conversion function
 */
async function convertDMsToLeads() {
  console.log("🔄 Starting DM to Lead conversion...");

  // Get unprocessed DMs
  const dms = await getUnprocessedDMs();

  if (!dms || dms.length === 0) {
    console.log("ℹ️  No DMs to convert");
    return {
      statusCode: 200,
      body: JSON.stringify({ converted: 0, skipped: 0 }),
    };
  }

  let converted = 0;
  let skipped = 0;

  // Process each DM
  for (const dm of dms) {
    const result = await convertDMToLead(dm);
    if (result) {
      converted++;
    } else {
      skipped++;
    }
  }

  console.log(`📊 Conversion complete: ${converted} leads created, ${skipped} skipped`);

  return {
    statusCode: 200,
    body: JSON.stringify({
      processed: dms.length,
      converted,
      skipped,
      timestamp: new Date().toISOString(),
    }),
  };
}

/**
 * Netlify Scheduled Function Handler
 * Runs every 60 minutes to process accumulated DMs
 */
exports.handler = async (event, context) => {
  return await convertDMsToLeads();
};

// Export for testing
exports.convertDMsToLeads = convertDMsToLeads;
