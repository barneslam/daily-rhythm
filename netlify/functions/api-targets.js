const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Sample fallback targets
const sampleTargets = [
  {
    id: 1,
    name: 'Corvera Solutions',
    business: 'Corvera Solutions',
    signal: 'Series B Funding',
    channel: 'LinkedIn',
    status: 'identified',
    confidence: 85,
    linkedin_url: 'https://linkedin.com/company/corvera-solutions',
    qualified: true
  },
  {
    id: 2,
    name: 'Data Intelligence Labs',
    business: 'Data Intelligence Labs',
    signal: 'VP Sales Hiring',
    channel: 'LinkedIn',
    status: 'identified',
    confidence: 78,
    linkedin_url: 'https://linkedin.com/company/data-intelligence-labs',
    qualified: true
  },
  {
    id: 3,
    name: 'SecureFlow Technologies',
    business: 'SecureFlow Technologies',
    signal: 'Product Launch',
    channel: 'LinkedIn',
    status: 'identified',
    confidence: 72,
    linkedin_url: 'https://linkedin.com/company/secureflow',
    qualified: false
  }
];

exports.handler = async (event, context) => {
  try {
    const { data: targets, error } = await supabase
      .from('gtm_targets')
      .select('*')
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false });

    if (error || !targets || targets.length === 0) {
      if (error) console.error('Error fetching targets:', error);

      const formattedTargets = sampleTargets.map(target => ({
        id: target.id,
        name: target.name,
        business: target.business,
        signal: target.signal,
        channel: target.channel,
        status: target.status,
        confidence: target.confidence,
        linkedin_url: target.linkedin_url,
        qualified: target.qualified
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: formattedTargets })
      };
    }

    const formattedTargets = targets.map(target => ({
      id: target.id,
      name: target.name || target.business,
      business: target.business,
      signal: target.signal,
      channel: target.outreach_channel || 'LinkedIn',
      status: target.status || 'identified',
      confidence: target.confidence || 70,
      linkedin_url: target.linkedin_url,
      qualified: target.qualified || false,
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
    const fallbackTargets = sampleTargets.map(target => ({
      id: target.id,
      name: target.name,
      business: target.business,
      signal: target.signal,
      channel: target.channel,
      status: target.status,
      confidence: target.confidence,
      linkedin_url: target.linkedin_url,
      qualified: target.qualified
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: fallbackTargets })
    };
  }
};
