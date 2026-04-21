const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };

  try {
    const q = event.queryStringParameters || {};
    const limit = parseInt(q.limit || '50');
    const days = parseInt(q.days || '30');
    const statusFilter = q.status || 'all';

    const startDate = new Date(Date.now() - days * 86400000).toISOString();

    let query = supabase
      .from('linkedin_dms')
      .select('*', { count: 'exact' })
      .gte('received_at', startDate)
      .order('received_at', { ascending: false })
      .limit(limit);

    if (statusFilter !== 'all') query = query.eq('lead_status', statusFilter);

    const { data: messages, error, count } = await query;
    if (error) throw error;

    const all = messages || [];

    const qualified = all.filter(m => m.auto_qualified).length;
    const percentQualified = all.length > 0 ? Math.round((qualified / all.length) * 100) : 0;
    const avgScore = all.length > 0
      ? Math.round(all.reduce((s, m) => s + (m.qualification_score || 0), 0) / all.length)
      : 0;

    const status_metrics = { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0, low_intent: 0 };
    const channel_metrics = {};
    all.forEach(m => {
      const s = m.lead_status || 'new';
      if (status_metrics.hasOwnProperty(s)) status_metrics[s]++;
      const ch = m.source_channel || 'linkedin';
      channel_metrics[ch] = (channel_metrics[ch] || 0) + 1;
    });

    // Normalise field names so dashboard kanban works (it expects sender_name, message_text etc)
    const normalised = all.map(m => ({
      ...m,
      channel: m.source_channel || 'linkedin',
      sender_email: m.sender_email || null,
      message_subject: m.source_post_theme || null,
    }));

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        messages: normalised,
        qualification_metrics: { total: all.length, qualified, notQualified: all.length - qualified, percentQualified, avgScore },
        status_metrics,
        channel_metrics,
      }),
    };
  } catch (err) {
    console.error('Inbound API error:', err.message);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({
        messages: [],
        qualification_metrics: { total: 0, qualified: 0, notQualified: 0, percentQualified: 0, avgScore: 0 },
        status_metrics: { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0, low_intent: 0 },
        channel_metrics: {},
        error: err.message,
      }),
    };
  }
};
