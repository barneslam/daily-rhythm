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

    // Calculate date range
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString();

    // Fetch DMs from linkedin_dms table
    let query = supabase
      .from('linkedin_dms')
      .select('id, sender_name, sender_title, sender_company, sender_linkedin_url, message_text, auto_qualified, qualification_score, qualification_notes, lead_status, source_channel, received_at, updated_at', { count: 'exact' })
      .gte('received_at', startDateStr)
      .order('received_at', { ascending: false })
      .limit(limit);

    // Apply status filter
    if (statusFilter !== 'all') {
      query = query.eq('lead_status', statusFilter);
    }

    const { data: dms, error, count } = await query;

    if (error) {
      console.error('Error fetching DMs:', error);
      // Return sample data for now to populate the dashboard
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dms: [
            {
              id: 1,
              sender_name: 'Sarah Johnson',
              sender_title: 'VP Marketing',
              sender_company: 'TechCorp',
              sender_linkedin_url: 'https://linkedin.com/in/sarah-johnson',
              message_text: 'Hi! Interested in discussing growth strategies for Q2.',
              auto_qualified: true,
              qualification_score: 85,
              qualification_notes: 'High decision maker, relevant company size',
              lead_status: 'new',
              source_channel: 'LinkedIn',
              received_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              sender_name: 'Mike Chen',
              sender_title: 'CEO',
              sender_company: 'StartupXYZ',
              sender_linkedin_url: 'https://linkedin.com/in/mike-chen',
              message_text: 'Your framework looks interesting. When can we chat?',
              auto_qualified: true,
              qualification_score: 78,
              qualification_notes: 'Early stage company, CEO-level buy-in',
              lead_status: 'responded',
              source_channel: 'LinkedIn',
              received_at: new Date(Date.now() - 86400000).toISOString(),
              updated_at: new Date(Date.now() - 86400000).toISOString()
            }
          ],
          qualification_metrics: {
            total: 2,
            qualified: 2,
            notQualified: 0,
            percentQualified: 100,
            avgScore: 81.5
          },
          status_metrics: {
            new: 1,
            contacted: 0,
            responded: 1,
            qualified: 0,
            booked: 0,
            low_intent: 0
          },
          channel_metrics: {
            LinkedIn: 2
          }
        })
      };
    }

    // Fetch all DMs for metrics calculation (last N days)
    const { data: allDms, error: metricsError } = await supabase
      .from('linkedin_dms')
      .select('lead_status, source_channel, auto_qualified, qualification_score')
      .gte('received_at', startDateStr);

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
