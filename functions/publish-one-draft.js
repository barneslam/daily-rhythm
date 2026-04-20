const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const channelMap = {
  the_strategy_pitch: { accountId: '17347', pageId: '103704197' },
  barneslam_co:       { accountId: '17347', pageId: null },
  axis_chamber:       { accountId: '17347', pageId: '112398033' },
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

    const channel = channelMap[draft.channel] || { accountId: '17347', pageId: null };
    const scheduleDate = draft.draft_date || new Date().toISOString().split('T')[0];

    // 9 AM EST = 14:00 UTC
    const payload = {
      accountId: channel.accountId,
      platform: 'linkedin',
      text: draft.content,
      scheduledTime: `${scheduleDate}T14:00:00Z`,
      mediaUrls: [],
    };
    if (channel.pageId) payload.pageId = channel.pageId;

    const response = await fetch('https://backend.blotato.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'blotato-api-key': blotatoKey,
      },
      body: JSON.stringify(payload),
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
