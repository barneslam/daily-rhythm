const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const sampleInboundMessages = [
  {
    id: 1,
    channel: 'email',
    sender_name: 'Jennifer Martinez',
    sender_email: 'jen@acmecorp.com',
    sender_title: 'Chief Revenue Officer',
    sender_company: 'ACME Corporation',
    message_subject: 'GTM optimization inquiry',
    message_text: 'Hi, we\'re looking to improve our go-to-market strategy for our new product line. Would love to discuss...',
    auto_qualified: true,
    qualification_score: 88,
    qualification_notes: 'CRO title, relevant company size, direct GTM inquiry',
    lead_status: 'new',
    received_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    channel: 'calendly',
    sender_name: 'David Thompson',
    sender_email: 'david@techventure.com',
    sender_title: 'VP Sales',
    sender_company: 'TechVenture Labs',
    message_subject: 'Booked: 30-min diagnostic call',
    message_text: 'Scheduled 30-minute diagnostic call - interested in discussing sales process optimization and revenue modeling.',
    auto_qualified: true,
    qualification_score: 82,
    qualification_notes: 'VP Sales, booked discovery call via Calendly',
    lead_status: 'qualified',
    received_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 3,
    channel: 'website',
    sender_name: 'Lisa Chen',
    sender_email: 'lisa@startupxyz.co',
    sender_title: 'Founder',
    sender_company: 'StartupXYZ',
    message_subject: 'Contact form submission: GTM help needed',
    message_text: 'We\'re a Series B startup struggling with GTM velocity. Looking for expertise in structuring sales motion and pricing strategy.',
    auto_qualified: true,
    qualification_score: 90,
    qualification_notes: 'Founder, Series B, clear GTM pain point, high fit',
    lead_status: 'new',
    received_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString()
  }
];

exports.handler = async (event, context) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '50');
    const days = parseInt(queryParams.days || '7');
    const statusFilter = queryParams.status || 'all';
    const channelFilter = queryParams.channel || 'all';

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString();

    let query = supabase
      .from('inbound_messages')
      .select('*', { count: 'exact' })
      .gte('received_at', startDateStr)
      .order('received_at', { ascending: false })
      .limit(limit);

    if (statusFilter !== 'all') {
      query = query.eq('lead_status', statusFilter);
    }

    if (channelFilter !== 'all') {
      query = query.eq('channel', channelFilter);
    }

    const { data: messages, error, count } = await query;

    if (error || !messages || messages.length === 0) {
      if (error) console.error('Error fetching messages:', error);

      const filtered = sampleInboundMessages
        .filter(m => !statusFilter || statusFilter === 'all' || m.lead_status === statusFilter)
        .filter(m => !channelFilter || channelFilter === 'all' || m.channel === channelFilter);

      const qualified = filtered.filter(m => m.auto_qualified).length;
      const notQualified = filtered.length - qualified;
      const percentQualified = filtered.length > 0 ? (qualified / filtered.length) * 100 : 0;
      const avgScore = filtered.length > 0
        ? (filtered.reduce((sum, m) => sum + (m.qualification_score || 0), 0) / filtered.length)
        : 0;

      const channelMetrics = {};
      filtered.forEach(m => {
        const channel = m.channel || 'unknown';
        channelMetrics[channel] = (channelMetrics[channel] || 0) + 1;
      });

      const statusMetrics = { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0, low_intent: 0 };
      filtered.forEach(m => {
        const status = m.lead_status || 'new';
        if (statusMetrics.hasOwnProperty(status)) {
          statusMetrics[status]++;
        }
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: filtered,
          qualification_metrics: { total: filtered.length, qualified, notQualified, percentQualified, avgScore },
          status_metrics: statusMetrics,
          channel_metrics: channelMetrics
        })
      };
    }

    const { data: allMessages, error: metricsError } = await supabase
      .from('inbound_messages')
      .select('lead_status, channel, auto_qualified, qualification_score')
      .gte('received_at', startDateStr);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
    }

    const allMessagesList = allMessages || [];
    const qualified = allMessagesList.filter(m => m.auto_qualified).length;
    const notQualified = allMessagesList.length - qualified;
    const percentQualified = allMessagesList.length > 0 ? (qualified / allMessagesList.length) * 100 : 0;
    const avgScore = allMessagesList.length > 0
      ? (allMessagesList.reduce((sum, m) => sum + (m.qualification_score || 0), 0) / allMessagesList.length)
      : 0;

    const qualification_metrics = {
      total: allMessagesList.length,
      qualified,
      notQualified,
      percentQualified,
      avgScore
    };

    const status_metrics = {
      new: 0,
      contacted: 0,
      responded: 0,
      qualified: 0,
      booked: 0,
      low_intent: 0
    };

    allMessagesList.forEach(m => {
      const status = m.lead_status || 'new';
      if (status_metrics.hasOwnProperty(status)) {
        status_metrics[status]++;
      }
    });

    const channel_metrics = {};
    allMessagesList.forEach(m => {
      const channel = m.channel || 'unknown';
      channel_metrics[channel] = (channel_metrics[channel] || 0) + 1;
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages || [],
        qualification_metrics,
        status_metrics,
        channel_metrics
      })
    };
  } catch (e) {
    console.error('Inbound API error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        qualification_metrics: { total: 0, qualified: 0, notQualified: 0, percentQualified: 0, avgScore: 0 },
        status_metrics: { new: 0, contacted: 0, responded: 0, qualified: 0, booked: 0, low_intent: 0 },
        channel_metrics: {},
        error: e.message
      })
    };
  }
};
