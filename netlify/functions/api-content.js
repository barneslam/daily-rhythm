const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Get content drafts with optional filtering
async function getContentDrafts(status = null) {
  try {
    let query = supabase
      .from('content_drafts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching content:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Fetch error:', e.message);
    return [];
  }
}

// Fallback sample content
function getSampleContent() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  return [
    {
      id: 1,
      business: 'TechStartup AI',
      trigger: 'funding_event',
      signal: 'Series A funding announcement',
      linkedin_draft: '🚀 Just spotted TechStartup AI raising Series A!\n\nThey\'re in growth mode. When founders invest in new funding, smart GTM acceleration is next.\n\nAre you helping portfolio companies scale?',
      instagram_draft: '🚀 TechStartup AI Series A = GTM refresh incoming 🔥',
      status: 'pending',
      created_at: now.toISOString(),
      preview: {
        linkedin: 'Just spotted TechStartup AI raising Series A!...',
        instagram: 'TechStartup AI Series A = GTM refresh incom...'
      }
    }
  ];
}

exports.handler = async (event, context) => {
  try {
    const { status, limit = 20 } = event.queryStringParameters || {};

    console.log(`📝 Fetching content drafts (status: ${status || 'all'})`);

    // Try to get from database, fall back to sample
    let drafts = await getContentDrafts(status);

    if (drafts.length === 0) {
      console.log('⚠️ No database content, using samples');
      drafts = getSampleContent();
    }

    drafts = drafts.slice(0, parseInt(limit));

    // Get all drafts for status counts
    const allDrafts = await getContentDrafts();
    if (allDrafts.length === 0) {
      allDrafts.push(...getSampleContent());
    }

    const statusCounts = {
      pending: allDrafts.filter(d => d.status === 'pending').length,
      approved: allDrafts.filter(d => d.status === 'approved').length,
      published: allDrafts.filter(d => d.status === 'published').length
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: drafts,
        count: drafts.length,
        total_count: allDrafts.length,
        status_counts: statusCounts,
        date: new Date().toISOString()
      })
    };
  } catch (e) {
    console.error('API error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: e.message,
        content: []
      })
    };
  }
};
