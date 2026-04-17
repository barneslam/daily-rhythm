const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const { data: targets, error } = await supabase
      .from('gtm_targets')
      .select('*')
      .order('date_found', { ascending: false });

    if (error) {
      console.error('Error fetching targets:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: [], error: error.message })
      };
    }

    const formattedTargets = (targets || []).map(target => ({
      id: target.id,
      name: target.name,
      business: target.business,
      signal: target.signal,
      channel: target.outreach_channel,
      status: target.status || 'identified',
      confidence: target.confidence || 'MEDIUM',
      linkedin_url: target.linkedin_url,
      qualified: target.qualified,
      draft_message: target.draft_message,
      needs_regen: target.needs_regen,
      follow_ups: target.follow_ups
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: formattedTargets })
    };
  } catch (e) {
    console.error('Targets API error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: [], error: e.message })
    };
  }
};
