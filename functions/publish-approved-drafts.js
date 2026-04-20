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
  if (!blotatoKey) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'BLOTATO_API_KEY not configured' }) };
  }

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
      const channel = channelMap[draft.channel] || { accountId: '17347', pageId: null };
      const scheduleDate = draft.draft_date || new Date().toISOString().split('T')[0];

      try {
        const response = await fetch('https://backend.blotato.com/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'blotato-api-key': blotatoKey,
          },
          body: JSON.stringify({
            post: {
              text: draft.content,
              target: channel.pageId
                ? { targetType: 'page', pageId: channel.pageId, platform: 'linkedin' }
                : { targetType: 'profile', accountId: channel.accountId, platform: 'linkedin' },
            },
            schedulingDate: `${scheduleDate}T14:00:00Z`,
            scheduleNow: false,
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

        results.push({ id: draft.id, channel: draft.channel, date: scheduleDate, status: 'published' });
      } catch (err) {
        results.push({ id: draft.id, channel: draft.channel, date: scheduleDate, status: 'failed', error: err.message });
      }
    }

    const published = results.filter(r => r.status === 'published').length;
    const failed = results.filter(r => r.status === 'failed').length;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        message: `${published} post(s) scheduled to Blotato${failed ? `, ${failed} failed` : ''}`,
        posts_count: published,
        failed,
        results
      })
    };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
