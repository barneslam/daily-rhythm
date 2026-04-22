const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Placeholder lead pool — replace with real API (Apollo, Crunchbase) when ready
const LEAD_POOL = [
  { name: 'Corvera Founder', business: 'Corvera', signal: 'Series A imminent — VP Sales hiring', confidence: 'HIGH', linkedin_url: 'https://www.linkedin.com/company/corvera' },
  { name: 'Sarah Chen', business: 'Data Intelligence Labs', signal: 'Series A — hiring VP Sales, market expansion', confidence: 'MEDIUM-HIGH', linkedin_url: null },
  { name: 'Marcus Johnson', business: 'SecureFlow', signal: 'New product launch — product-led growth phase', confidence: 'MEDIUM-HIGH', linkedin_url: null },
  { name: 'Emma Rodriguez', business: 'CloudScale Systems', signal: 'Series A funding — rapid hiring', confidence: 'MEDIUM', linkedin_url: null },
  { name: 'Alex Park', business: 'AutoMate AI', signal: 'New product launch — enterprise expansion', confidence: 'MEDIUM', linkedin_url: null },
  { name: 'Lisa Wong', business: 'Velocity Analytics', signal: 'Growth plateau — seeking GTM acceleration', confidence: 'MEDIUM-HIGH', linkedin_url: null },
  { name: 'James Mitchell', business: 'FinOps Solutions', signal: 'Series B — international expansion', confidence: 'HIGH', linkedin_url: null },
  { name: 'Priya Desai', business: 'DevTools Pro', signal: 'Series A — enterprise go-to-market phase', confidence: 'MEDIUM', linkedin_url: null },
];

exports.handler = async () => {
  try {
    console.log('🔍 Daily lead discovery triggered');

    // Fetch existing lead names to avoid duplicates
    const { data: existing } = await supabase.from('gtm_targets').select('name');
    const existingNames = new Set((existing || []).map(r => r.name));

    const newLeads = LEAD_POOL
      .filter(l => !existingNames.has(l.name))
      .map(l => ({
        ...l,
        status: 'identified',
        source: 'discovery',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (newLeads.length === 0) {
      console.log('⏭ No new leads to insert (all already in DB)');
      return { statusCode: 200, body: JSON.stringify({ leads_added: 0 }) };
    }

    const { error } = await supabase.from('gtm_targets').insert(newLeads);
    if (error) throw error;

    console.log(`✅ Inserted ${newLeads.length} new leads`);
    return { statusCode: 200, body: JSON.stringify({ leads_added: newLeads.length }) };
  } catch (err) {
    console.error('Discovery error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
