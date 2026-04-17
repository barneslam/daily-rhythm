/**
 * Phase 5: DM Pipeline Data Endpoint
 * GET /.netlify/functions/dms
 * Returns aggregated DM metrics and list for dashboard display
 */

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Main handler
 */
exports.handler = async (event) => {
  console.log("📊 DM Pipeline endpoint called");

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Use GET to fetch DMs" }),
    };
  }

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || "50");
    const days = parseInt(queryParams.days || "7");
    const statusFilter = queryParams.status || "all";

    console.log(`📋 Fetching DMs: limit=${limit}, days=${days}, status=${statusFilter}`);

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString();

    // Build query
    let query = supabase
      .from("linkedin_dms")
      .select(
        `
        id,
        sender_name,
        sender_title,
        sender_company,
        message_text,
        auto_qualified,
        qualification_score,
        qualification_notes,
        lead_status,
        source_channel,
        source_post_theme,
        received_at,
        updated_at
      `,
        { count: "exact" }
      )
      .gte("received_at", startDateStr)
      .order("received_at", { ascending: false })
      .limit(limit);

    // Apply status filter
    if (statusFilter !== "all") {
      query = query.eq("lead_status", statusFilter);
    }

    const { data: dms, error, count } = await query;

    if (error) {
      console.error("❌ Failed to fetch DMs:", error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Database error: ${error.message}` }),
      };
    }

    // Fetch metrics data separately
    const { data: allDms, error: metricsError } = await supabase
      .from("linkedin_dms")
      .select("lead_status, source_channel, auto_qualified, qualification_score")
      .gte("received_at", startDateStr);

    if (metricsError) {
      console.error("❌ Failed to fetch metrics:", metricsError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Metrics error: ${metricsError.message}` }),
      };
    }

    // Calculate qualification_metrics
    const qualified = allDms.filter(dm => dm.auto_qualified).length;
    const notQualified = allDms.length - qualified;
    const qualificationRate = allDms.length > 0 ? (qualified / allDms.length) : 0;

    const qualification_metrics = {
      total: allDms.length,
      qualified,
      not_qualified: notQualified,
      qualification_rate: parseFloat(qualificationRate.toFixed(3)),
    };

    // Calculate status_metrics
    const status_metrics = {
      new: 0,
      contacted: 0,
      responded: 0,
      qualified: 0,
      booked: 0,
      low_intent: 0,
    };

    allDms.forEach((dm) => {
      const status = dm.lead_status || "new";
      if (status_metrics.hasOwnProperty(status)) {
        status_metrics[status]++;
      }
    });

    // Calculate channel_metrics
    const channel_metrics = {};
    allDms.forEach((dm) => {
      const channel = dm.source_channel || "unknown";
      channel_metrics[channel] = (channel_metrics[channel] || 0) + 1;
    });

    console.log(`✓ Returning ${dms.length} DMs with metrics`);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dms: dms || [],
        qualification_metrics,
        status_metrics,
        channel_metrics,
      }),
    };
  } catch (error) {
    console.error("❌ DM Pipeline endpoint error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        dms: [],
        qualification_metrics: { total: 0, qualified: 0, not_qualified: 0, qualification_rate: 0 },
        status_metrics: { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0, low_intent: 0 },
        channel_metrics: {},
      }),
    };
  }
};
