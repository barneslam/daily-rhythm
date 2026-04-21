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
    const { data, error } = await supabase
      .from('gtm_drafts')
      .select('*')
      .order('draft_date', { ascending: true });

    if (error) throw error;

    const pending = data.filter(d => d.status === 'pending' || d.status === 'pending_approval');
    const approved = data.filter(d => d.status === 'approved');
    const published = data.filter(d => d.status === 'published');

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ pending, approved, published })
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
