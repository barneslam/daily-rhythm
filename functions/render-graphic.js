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

const STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','had','do','does','did','will','would','could','should','may','might','not','no','so','if','as','it','its','this','that','they','them','their','we','our','you','your','i','my','me','he','she','his','her','who','which','when','where','what','how','all','most','more','very','just','also','than','then','there','here','up','out','about','into','over','after','before','because','while','though','even']);

function extractKeyword(content, channel) {
  const fallbacks = { the_strategy_pitch: 'business strategy', barneslam_co: 'executive leadership', axis_chamber: 'team performance' };
  const words = content.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 4 && !STOP_WORDS.has(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  const keyword = top.length > 0 ? top.slice(0, 1).join(' ') : (fallbacks[channel] || 'business');
  return `business professional people ${keyword}`;
}

async function getUnsplashPhoto(query, usedIds = []) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&count=10`,
      { headers: { Authorization: `Client-ID ${key}` } }
    );
    if (!res.ok) return null;
    const photos = await res.json();
    const list = Array.isArray(photos) ? photos : [photos];
    const pick = list.find(p => !usedIds.includes(p.id)) || list[0];
    if (!pick) return null;
    return { url: pick.urls?.regular || null, id: pick.id };
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

    // Fetch all previously used Unsplash photo IDs to avoid duplicates
    const { data: usedRows } = await supabase
      .from('gtm_drafts')
      .select('unsplash_photo_id')
      .not('unsplash_photo_id', 'is', null);
    const usedIds = (usedRows || []).map(r => r.unsplash_photo_id).filter(Boolean);

    const query = extractKeyword(draft.content || '', draft.channel);
    const photo = await getUnsplashPhoto(query, usedIds);
    const photoUrl = photo?.url || null;

    // Save chosen photo ID to the draft before rendering
    if (photo?.id) {
      await supabase.from('gtm_drafts').update({ unsplash_photo_id: photo.id }).eq('id', draftId);
    }

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
