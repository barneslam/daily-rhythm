/**
 * DMs API — Fetch DM pipeline data for dashboard display
 * Endpoint: GET /api/dms?limit=50&days=7&status=all
 * Returns: DM list, qualification breakdown, metrics by channel
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Fetch DM list with optional filters
 */
async function getDMs(limit = 50, days = 7, status = "all") {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  let query = supabase
    .from("linkedin_dms")
    .select("*")
    .gte("received_at", cutoffDate.toISOString())
    .order("received_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("lead_status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Failed to fetch DMs:", error.message);
    throw error;
  }

  return data || [];
}

/**
 * Calculate qualification breakdown
 */
async function getQualificationMetrics(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("linkedin_dms")
    .select("auto_qualified, qualification_score")
    .gte("received_at", cutoffDate.toISOString());

  if (error) {
    console.error("❌ Failed to fetch qualification metrics:", error.message);
    return { total: 0, qualified: 0, notQualified: 0, avgScore: 0, percentQualified: 0 };
  }

  const items = data || [];
  const total = items.length;
  const qualified = items.filter(i => i.auto_qualified).length;
  const notQualified = total - qualified;
  const avgScore =
    items.length > 0
      ? (items.reduce((sum, i) => sum + (i.qualification_score || 0), 0) / items.length).toFixed(2)
      : 0;
  const percentQualified = total > 0 ? ((qualified / total) * 100).toFixed(1) : 0;

  return {
    total,
    qualified,
    notQualified,
    avgScore: parseFloat(avgScore),
    percentQualified: parseFloat(percentQualified),
  };
}

/**
 * Get metrics by source channel
 */
async function getChannelMetrics(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("linkedin_dms")
    .select("source_channel, auto_qualified, source_post_theme")
    .gte("received_at", cutoffDate.toISOString());

  if (error) {
    console.error("❌ Failed to fetch channel metrics:", error.message);
    return {};
  }

  const items = data || [];
  const metrics = {};

  for (const item of items) {
    const channel = item.source_channel || "unknown";
    if (!metrics[channel]) {
      metrics[channel] = { total: 0, qualified: 0, themes: {} };
    }
    metrics[channel].total += 1;
    if (item.auto_qualified) metrics[channel].qualified += 1;

    const theme = item.source_post_theme || "unknown";
    metrics[channel].themes[theme] = (metrics[channel].themes[theme] || 0) + 1;
  }

  return metrics;
}

/**
 * Get lead status breakdown
 */
async function getStatusMetrics(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const { data, error } = await supabase
    .from("linkedin_dms")
    .select("lead_status")
    .gte("received_at", cutoffDate.toISOString());

  if (error) {
    console.error("❌ Failed to fetch status metrics:", error.message);
    return {};
  }

  const items = data || [];
  const statusCounts = {};

  for (const item of items) {
    const status = item.lead_status || "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }

  return statusCounts;
}

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  console.log("📊 DMs API request");

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const limit = Math.min(parseInt(queryParams.limit) || 50, 500);
    const days = Math.min(parseInt(queryParams.days) || 7, 90);
    const status = queryParams.status || "all";

    // Fetch all data in parallel
    const [dms, qualMetrics, channelMetrics, statusMetrics] = await Promise.all([
      getDMs(limit, days, status),
      getQualificationMetrics(days),
      getChannelMetrics(days),
      getStatusMetrics(days),
    ]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dms,
        qualification_metrics: qualMetrics,
        status_metrics: statusMetrics,
        channel_metrics: channelMetrics,
        time_range: {
          days,
          from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0],
        },
      }),
    };
  } catch (error) {
    console.error("❌ API error:", error.message);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
