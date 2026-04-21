const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const brandMap = {
  the_strategy_pitch: 'The Strategy Pitch',
  barneslam_co:       'BarnesLam.co',
  axis_chamber:       'Axis Chamber',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const blotatoKey = process.env.BLOTATO_API_KEY;
  if (!blotatoKey) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'BLOTATO_API_KEY not configured' }) };

  try {
    const { draftId } = JSON.parse(event.body || '{}');
    if (!draftId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'draftId required' }) };

    const { data: draft, error: fetchErr } = await supabase
      .from('gtm_drafts').select('*').eq('id', draftId).single();
    if (fetchErr || !draft) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Draft not found' }) };

    const brand = brandMap[draft.channel] || 'BarnesLam.co';
    const scheduleDate = draft.draft_date || new Date().toISOString().split('T')[0];

    const graphicUrl = `https://daily-lead-gen-track.netlify.app/api/graphic-png?file=${draft.channel}-${scheduleDate}`;

    const response = await fetch('https://api.blotato.com/v1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${blotatoKey}`,
      },
      body: JSON.stringify({
        platforms: ['linkedin', 'instagram'],
        content: draft.content,
        scheduled_at: `${scheduleDate}T14:00:00Z`,
        brand,
        media_urls: [graphicUrl],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Blotato ${response.status}: ${errText}`);
    }

    await supabase
      .from('gtm_drafts')
      .update({ status: 'published', updated_at: new Date().toISOString() })
      .eq('id', draft.id);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, channel: draft.channel, scheduled: `${scheduleDate}T14:00:00Z` })
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
