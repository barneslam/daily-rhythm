const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';
const SUPABASE_STORAGE_URL = `${process.env.SUPABASE_URL}/storage/v1/object/public/graphics`;

const channelMap = {
  the_strategy_pitch: { linkedinPageId: '103704197' },
  barneslam_co:       { linkedinPageId: null },
  axis_chamber:       { linkedinPageId: '112398033' },
};
const LINKEDIN_ACCOUNT_ID = '17347';
const INSTAGRAM_ACCOUNT_ID = '40098';

async function blotatoPost(apiKey, payload) {
  const res = await fetch(BLOTATO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'blotato-api-key': apiKey },
    body: JSON.stringify({ post: payload }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Blotato ${res.status}: ${err}`);
  }
  return res.json();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'BLOTATO_API_KEY not configured' }) };

  try {
    const { draftId } = JSON.parse(event.body || '{}');
    if (!draftId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'draftId required' }) };

    const { data: draft, error: fetchErr } = await supabase
      .from('gtm_drafts').select('*').eq('id', draftId).single();
    if (fetchErr || !draft) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Draft not found' }) };

    const scheduleDate = draft.draft_date || new Date().toISOString().split('T')[0];
    const scheduledTime = `${scheduleDate}T14:00:00Z`;
    const channel = channelMap[draft.channel] || {};
    const graphicUrl = draft.graphic_url || `${SUPABASE_STORAGE_URL}/${draft.channel}-${scheduleDate}.png`;
    const mediaUrls = [graphicUrl];

    const linkedinTarget = { targetType: 'linkedin' };
    if (channel.linkedinPageId) linkedinTarget.pageId = channel.linkedinPageId;

    const results = [];

    // LinkedIn
    try {
      await blotatoPost(apiKey, {
        accountId: LINKEDIN_ACCOUNT_ID,
        target: linkedinTarget,
        content: { text: draft.content, platform: 'linkedin', mediaUrls },
        scheduledTime,
      });
      results.push({ platform: 'linkedin', status: 'scheduled' });
    } catch (err) {
      results.push({ platform: 'linkedin', status: 'failed', error: err.message });
    }

    // Instagram
    try {
      await blotatoPost(apiKey, {
        accountId: INSTAGRAM_ACCOUNT_ID,
        target: { targetType: 'instagram' },
        content: { text: draft.content, platform: 'instagram', mediaUrls },
        scheduledTime,
      });
      results.push({ platform: 'instagram', status: 'scheduled' });
    } catch (err) {
      results.push({ platform: 'instagram', status: 'failed', error: err.message });
    }

    const anySuccess = results.some(r => r.status === 'scheduled');
    if (anySuccess) {
      await supabase
        .from('gtm_drafts')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', draft.id);
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: anySuccess, channel: draft.channel, scheduled: scheduledTime, results })
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
