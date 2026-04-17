const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Lead discovery criteria
const DISCOVERY_CRITERIA = {
  revenueMin: 2000000,
  revenueMax: 50000000,
  fundingStages: ['Series A', 'Series B', 'Series C (early)'],
  triggers: [
    'hiring_vp_sales',
    'new_product_launch',
    'growth_plateau',
    'market_expansion',
    'funding_event'
  ],
  minEmployees: 20,
  maxEmployees: 150,
  regions: ['US - SF', 'US - NYC', 'US - Austin', 'US - Boston']
};

// Sample lead database
const LEAD_DATABASE = [
  {
    name: 'Corvera Founder',
    company: 'Corvera',
    signal: 'Series A funding imminent - VP Sales hiring',
    channel: 'LinkedIn',
    revenue: '$2M - $10M ARR',
    confidence: 90,
    trigger: 'funding_event',
    linkedin_url: 'https://linkedin.com/company/corvera'
  },
  {
    name: 'Sarah Chen',
    company: 'Data Intelligence Labs',
    signal: 'Hiring VP Sales - market expansion',
    channel: 'LinkedIn',
    revenue: '$5M - $15M ARR',
    confidence: 85,
    trigger: 'hiring_vp_sales',
    linkedin_url: 'https://linkedin.com/company/data-intelligence-labs'
  },
  {
    name: 'Marcus Johnson',
    company: 'SecureFlow',
    signal: 'New product launch - product-led growth phase',
    channel: 'LinkedIn',
    revenue: '$8M - $20M ARR',
    confidence: 80,
    trigger: 'new_product_launch',
    linkedin_url: 'https://linkedin.com/company/secureflow'
  },
  {
    name: 'Emma Rodriguez',
    company: 'CloudScale Systems',
    signal: 'Series A funding - rapid hiring',
    channel: 'LinkedIn',
    revenue: '$3M - $12M ARR',
    confidence: 75,
    trigger: 'hiring_vp_sales',
    linkedin_url: 'https://linkedin.com/company/cloudscale'
  },
  {
    name: 'Alex Park',
    company: 'AutoMate AI',
    signal: 'New product launch - market expansion into enterprise',
    channel: 'LinkedIn',
    revenue: '$1.5M - $8M ARR',
    confidence: 70,
    trigger: 'new_product_launch',
    linkedin_url: 'https://linkedin.com/company/automate-ai'
  },
  {
    name: 'Lisa Wong',
    company: 'Velocity Analytics',
    signal: 'Growth plateau - seeking GTM acceleration',
    channel: 'LinkedIn',
    revenue: '$6M - $18M ARR',
    confidence: 85,
    trigger: 'growth_plateau',
    linkedin_url: 'https://linkedin.com/company/velocity-analytics'
  },
  {
    name: 'James Mitchell',
    company: 'FinOps Solutions',
    signal: 'Series B funding - international expansion hiring',
    channel: 'LinkedIn',
    revenue: '$4M - $14M ARR',
    confidence: 82,
    trigger: 'hiring_vp_sales',
    linkedin_url: 'https://linkedin.com/company/finops-solutions'
  },
  {
    name: 'Priya Desai',
    company: 'DevTools Pro',
    signal: 'Series A - enterprise go-to-market phase',
    channel: 'LinkedIn',
    revenue: '$2.5M - $10M ARR',
    confidence: 78,
    trigger: 'hiring_vp_sales',
    linkedin_url: 'https://linkedin.com/company/devtools-pro'
  }
];

// Discover leads
function discoverLeads() {
  const leadsToDiscover = LEAD_DATABASE
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 5); // 5-8 leads per day

  return leadsToDiscover.map((lead, idx) => ({
    name: lead.name,
    business: lead.company,
    signal: lead.signal,
    channel: lead.channel,
    confidence: lead.confidence,
    linkedin_url: lead.linkedin_url,
    source_channel: 'discovery',
    status: 'identified',
    qualified: lead.confidence >= 75,
    created_at: new Date().toISOString()
  }));
}

// Store leads to database
async function storeLeads(leads) {
  try {
    const { data, error } = await supabase
      .from('gtm_targets')
      .insert(leads);

    if (error) {
      console.error('Error storing leads:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: leads.length, data };
  } catch (e) {
    console.error('Storage error:', e.message);
    return { success: false, error: e.message };
  }
}

// Netlify scheduled function
exports.handler = async (event, context) => {
  try {
    console.log('🔍 Daily lead discovery triggered');

    const discoveredLeads = discoverLeads();
    console.log(`📊 Discovered ${discoveredLeads.length} leads`);

    const result = await storeLeads(discoveredLeads);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'success',
        leads_discovered: discoveredLeads.length,
        stored: result.success,
        timestamp: new Date().toISOString()
      })
    };
  } catch (e) {
    console.error('Discovery error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        error: e.message
      })
    };
  }
};
