const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_STATUSES = ['identified', 'connection_req', 'connected', 'messaged', 'responded', 'disqualified'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { leadId, status } = JSON.parse(event.body || '{}');
    if (!leadId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'leadId required' }) };
    if (!VALID_STATUSES.includes(status)) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Invalid status: ${status}` }) };

    const { error } = await supabase
      .from('gtm_targets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) throw error;

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, leadId, status }) };
  } catch (err) {
    console.error('lead-update-status error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
