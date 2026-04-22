const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { targetId, customPrompt } = JSON.parse(event.body || '{}');
    if (!targetId) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'targetId required' }) };

    const { data: target, error } = await supabase
      .from('gtm_targets')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !target) throw new Error('Target not found');

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Write a LinkedIn connection request note for Barnes Lam to send to ${target.name}${target.business ? ` at ${target.business}` : ''}.

Signal/context: ${target.signal || 'B2B operator or founder'}
Current draft message: ${target.draft_message || '(none)'}

Additional instruction from Barnes: ${customPrompt}

Rules:
- Under 300 characters (LinkedIn connection note limit)
- No em dashes
- Specific to the person — reference their signal or context
- Peer-to-operator tone, not salesy
- No "hope this finds you well" or generic openers
- End with a statement or soft observation, not a question

Return the note text only — no subject line, no quotes, no preamble.`,
      }],
    });

    const connection_message = msg.content[0].text.trim();

    await supabase
      .from('gtm_targets')
      .update({ draft_message: connection_message, needs_regen: false, updated_at: new Date().toISOString() })
      .eq('id', targetId);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, connection_message }) };
  } catch (err) {
    console.error('connection-message error:', err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) };
  }
};
