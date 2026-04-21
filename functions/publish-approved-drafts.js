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
    const { data: drafts, error } = await supabase
      .from('gtm_drafts')
      .select('*')
      .eq('status', 'approved')
      .order('draft_date', { ascending: true });

    if (error) throw error;
    if (!drafts || drafts.length === 0) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ message: 'No approved drafts to publish', posts_count: 0 }) };
    }

    const results = [];

    for (const draft of drafts) {
      const scheduleDate = draft.draft_date || new Date().toISOString().split('T')[0];
      const scheduledTime = `${scheduleDate}T14:00:00Z`;
      const channel = channelMap[draft.channel] || {};
      const graphicUrl = draft.graphic_url || `${SUPABASE_STORAGE_URL}/${draft.channel}-${scheduleDate}.png`;
      const mediaUrls = [graphicUrl];

      const linkedinTarget = { targetType: 'linkedin' };
      if (channel.linkedinPageId) linkedinTarget.pageId = channel.linkedinPageId;

      const draftResults = [];

      try {
        await blotatoPost(apiKey, {
          accountId: LINKEDIN_ACCOUNT_ID,
          target: linkedinTarget,
          content: { text: draft.content, platform: 'linkedin', mediaUrls },
          scheduledTime,
        });
        draftResults.push({ platform: 'linkedin', status: 'scheduled' });
      } catch (err) {
        draftResults.push({ platform: 'linkedin', status: 'failed', error: err.message });
      }

      try {
        await blotatoPost(apiKey, {
          accountId: INSTAGRAM_ACCOUNT_ID,
          target: { targetType: 'instagram' },
          content: { text: draft.content, platform: 'instagram', mediaUrls },
          scheduledTime,
        });
        draftResults.push({ platform: 'instagram', status: 'scheduled' });
      } catch (err) {
        draftResults.push({ platform: 'instagram', status: 'failed', error: err.message });
      }

      const anySuccess = draftResults.some(r => r.status === 'scheduled');
      if (anySuccess) {
        await supabase
          .from('gtm_drafts')
          .update({ status: 'published', updated_at: new Date().toISOString() })
          .eq('id', draft.id);
      }

      results.push({ id: draft.id, channel: draft.channel, date: scheduleDate, platforms: draftResults });
    }

    const published = results.filter(r => r.platforms.some(p => p.status === 'scheduled')).length;
    const failed = results.filter(r => r.platforms.every(p => p.status === 'failed')).length;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        message: `${published} post(s) scheduled to Blotato${failed ? `, ${failed} fully failed` : ''}`,
        posts_count: published,
        failed,
        results
      })
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
