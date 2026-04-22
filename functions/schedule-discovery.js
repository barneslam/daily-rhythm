const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const APOLLO_API = 'https://api.apollo.io/v1/mixed_people/search';

// Build a human-readable signal from Apollo data
function buildSignal(person) {
  const stage = person.organization?.latest_funding_stage;
  const title = person.title || '';
  const raised = person.organization?.total_funding_printed;

  const parts = [];
  if (stage) parts.push(`${stage.replace(/_/g, ' ')} funded`);
  if (raised) parts.push(`raised ${raised}`);
  if (/VP.*Sales|CRO|Chief Revenue/i.test(title)) parts.push('revenue leadership hire signal');
  return parts.join(' — ') || 'B2B operator match';
}

async function fetchApolloLeads() {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) throw new Error('APOLLO_API_KEY not set');

  const res = await fetch(APOLLO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey, 'Cache-Control': 'no-cache' },
    body: JSON.stringify({
      page: 1,
      per_page: 25,
      person_titles: [
        'CEO', 'Co-Founder', 'Founder', 'CRO',
        'VP Sales', 'VP of Sales', 'Chief Revenue Officer', 'Head of Sales',
        'VP Revenue', 'VP Growth',
      ],
      organization_num_employees_ranges: ['20,150'],
      person_locations: [
        'San Francisco, California, United States',
        'New York, New York, United States',
        'Austin, Texas, United States',
        'Boston, Massachusetts, United States',
      ],
      organization_latest_funding_stage_cd: ['series_a', 'series_b'],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apollo API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.people || [];
}

exports.handler = async () => {
  try {
    console.log('🔍 Daily lead discovery — Apollo.io');

    const people = await fetchApolloLeads();
    console.log(`Apollo returned ${people.length} candidates`);

    if (people.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ leads_added: 0, message: 'No results from Apollo' }) };
    }

    // Fetch existing linkedin_urls and names to deduplicate
    const { data: existing } = await supabase
      .from('gtm_targets')
      .select('name, linkedin_url');

    const existingNames = new Set((existing || []).map(r => r.name?.toLowerCase()));
    const existingUrls = new Set((existing || []).map(r => r.linkedin_url).filter(Boolean));

    const newLeads = people
      .filter(p => {
        if (!p.name) return false;
        if (existingNames.has(p.name.toLowerCase())) return false;
        if (p.linkedin_url && existingUrls.has(p.linkedin_url)) return false;
        return true;
      })
      .map(p => ({
        name: p.name,
        business: p.organization?.name || null,
        signal: buildSignal(p),
        confidence: 'HIGH',
        linkedin_url: p.linkedin_url || null,
        status: 'identified',
        source: 'apollo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (newLeads.length === 0) {
      console.log('⏭ All Apollo results already in DB');
      return { statusCode: 200, body: JSON.stringify({ leads_added: 0 }) };
    }

    const { error } = await supabase.from('gtm_targets').insert(newLeads);
    if (error) throw error;

    console.log(`✅ Inserted ${newLeads.length} new leads from Apollo`);
    return { statusCode: 200, body: JSON.stringify({ leads_added: newLeads.length }) };
  } catch (err) {
    console.error('Discovery error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
