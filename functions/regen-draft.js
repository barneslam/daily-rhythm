const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const CHANNEL_VOICE = {
  barneslam_co: 'Authority voice — big bold market POVs, no personal stories, no tactical tips. Contrarian, precise, thought-provoking. Target: Founders/CEOs at $5M–$50M.',
  the_strategy_pitch: 'Execution Architect voice — frameworks, strategic systems, operational structure. Show the gap between strategy and execution. Target: CROs and Founders.',
  axis_chamber: 'Performance systems voice — accountability, daily rhythm, structure over discipline. Tactical but systemic. Target: operators and high performers.'
};

const CHANNEL_URL = {
  barneslam_co: 'barneslam.co',
  the_strategy_pitch: 'thestrategypitch.com',
  axis_chamber: 'axischamber.org'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { draftId } = JSON.parse(event.body || '{}');
    if (!draftId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'draftId required' }) };

    // Fetch existing draft
    const { data: draft, error: fetchErr } = await supabase
      .from('gtm_drafts').select('*').eq('id', draftId).single();
    if (fetchErr || !draft) return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: 'Draft not found' }) };

    const voice = CHANNEL_VOICE[draft.channel] || 'Strategic GTM voice';
    const siteUrl = CHANNEL_URL[draft.channel] || '';

    const prompt = `You are writing a LinkedIn post for a GTM advisor who works with founders and CROs at $2M–$50M revenue B2B tech companies.

CHANNEL VOICE: ${voice}

RULES:
- 150–250 words
- No bullet points in the opening — start with a bold statement or short observation
- One specific insight, story, or framework
- End with a clear CTA (DM, comment, or link)
- Include the URL: ${siteUrl}/[relevant-slug]
- Include 4–5 relevant hashtags on the last line
- Do NOT use em-dashes (—) excessively
- Sound like a peer talking to a peer, not a coach talking at a client

Write a DIFFERENT post from this previous version (regenerate with fresh angle):
---
${draft.content}
---

Return ONLY the post text. No preamble, no quotes around it.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    const newContent = message.content[0].text.trim();

    // Update draft with new content, reset to pending_approval
    const { data: updated, error: updateErr } = await supabase
      .from('gtm_drafts')
      .update({ content: newContent, status: 'pending_approval', updated_at: new Date().toISOString() })
      .eq('id', draftId)
      .select();

    if (updateErr) throw updateErr;

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ success: true, draft: updated[0] })
    };
  } catch (err) {
    console.error('Regen error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
