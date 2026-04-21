const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { draftId } = JSON.parse(event.body || '{}');
    if (!draftId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'draftId required' }) };

    const { data, error } = await supabase
      .from('gtm_drafts')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', draftId)
      .select();

    if (error) throw error;
    const draft = data[0];

    // Fire-and-forget graphic generation — don't block approval on render time
    if (draft && !draft.graphic_url) {
      const edgeUrl = `${process.env.SUPABASE_URL}/functions/v1/render-graphic`;
      fetch(edgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ draftId: draft.id, channel: draft.channel, draft_date: draft.draft_date, content: draft.content }),
      }).catch(() => {}); // don't fail approval if graphic fails
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, draft, graphic: 'generating...' })
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
