const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '50');
    const days = parseInt(queryParams.days || '7');
    const statusFilter = queryParams.status || 'all';

    // Fetch DMs from linkedin_dms table
    let query = supabase
      .from('linkedin_dms')
      .select('id, sender_name, sender_title, sender_company, sender_linkedin_url, message_text, auto_qualified, qualification_score, qualification_notes, lead_status, source_channel, received_at, updated_at', { count: 'exact' })
      .gte('received_at', `now()-${days} days`)
      .order('received_at', { ascending: false })
      .limit(limit);

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('lead_status', statusFilter);
    }

    const { data: dms, error, count } = await query;

    if (error) {
      console.error('Error fetching DMs:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message, dms: [], qualification_metrics: {}, status_metrics: {}, channel_metrics: {} })
      };
    }

    // Fetch all DMs for metrics calculation (last N days)
    const { data: allDms, error: metricsError } = await supabase
      .from('linkedin_dms')
      .select('lead_status, source_channel, auto_qualified, qualification_score')
      .gte('received_at', `now()-${days} days`);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
    }

    // Calculate qualification metrics
    const allDmsList = allDms || [];
    const qualified = allDmsList.filter(dm => dm.auto_qualified).length;
    const notQualified = allDmsList.length - qualified;
    const percentQualified = allDmsList.length > 0 ? (qualified / allDmsList.length) * 100 : 0;
    const avgScore = allDmsList.length > 0 ? (allDmsList.reduce((sum, dm) => sum + (dm.qualification_score || 0), 0) / allDmsList.length) : 0;

    const qualification_metrics = {
      total: allDmsList.length,
      qualified,
      notQualified,
      percentQualified,
      avgScore
    };

    // Calculate status metrics
    const status_metrics = {
      new: 0,
      contacted: 0,
      responded: 0,
      qualified: 0,
      booked: 0,
      low_intent: 0
    };

    allDmsList.forEach((dm) => {
      const status = dm.lead_status || 'new';
      if (status_metrics.hasOwnProperty(status)) {
        status_metrics[status]++;
      }
    });

    // Calculate channel metrics
    const channel_metrics = {};
    allDmsList.forEach((dm) => {
      const channel = dm.source_channel || 'unknown';
      channel_metrics[channel] = (channel_metrics[channel] || 0) + 1;
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dms: dms || [],
        qualification_metrics,
        status_metrics,
        channel_metrics
      })
    };
  } catch (e) {
    console.error('DMs API error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dms: [],
        qualification_metrics: { total: 0, qualified: 0, notQualified: 0, percentQualified: 0, avgScore: 0 },
        status_metrics: { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0, low_intent: 0 },
        channel_metrics: {},
        error: e.message
      })
    };
  }
};
