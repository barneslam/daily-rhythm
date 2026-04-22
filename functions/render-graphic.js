const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const TOPIC_KEYWORDS = {
  the_strategy_pitch: 'business strategy boardroom',
  barneslam_co: 'leadership executive office',
  axis_chamber: 'team performance collaboration',
};

async function getUnsplashPhoto(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.urls?.regular || null;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: '{}' };

  try {
    const { draftId } = JSON.parse(event.body || '{}');
    if (!draftId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'draftId required' }) };

    const { data: draft, error } = await supabase
      .from('gtm_drafts')
      .select('id, channel, draft_date, content')
      .eq('id', draftId)
      .single();

    if (error || !draft) throw new Error(error?.message || 'Draft not found');

    const query = TOPIC_KEYWORDS[draft.channel] || 'professional business';
    const photoUrl = await getUnsplashPhoto(query);

    const res = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/render-graphic`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          draftId: draft.id,
          channel: draft.channel,
          draft_date: draft.draft_date,
          content: draft.content,
          photoUrl,
        }),
      }
    );

    const result = await res.json();
    return { statusCode: res.status, headers: CORS, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
