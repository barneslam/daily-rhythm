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
    const { data: targets, error } = await supabase
      .from('gtm_targets')
      .select('*')
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = (targets || []).map(t => ({
      id: t.id,
      name: t.name || t.business,
      business: t.business,
      signal: t.signal,
      channel: t.outreach_channel || 'LinkedIn',
      status: t.status || 'identified',
      confidence: t.confidence || 70,
      linkedin_url: t.linkedin_url,
      qualified: t.qualified || false,
      draft_message: t.draft_message,
      needs_regen: t.needs_regen,
      follow_ups: t.follow_ups,
      notes: t.notes,
      closing_stage: t.closing_stage,
    }));

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ targets: formatted }) };
  } catch (err) {
    console.error('Targets API error:', err.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message, targets: [] }) };
  }
};
