const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Content templates by signal type
const contentTemplates = {
  funding_event: {
    linkedin: `🚀 Just spotted {company} raising Series {stage}!

{signal}

This is a perfect moment for GTM acceleration. Companies in growth mode need:
✓ Go-to-market strategy refinement
✓ Sales process documentation
✓ Revenue playbook for new market segments

Are you helping portfolio companies scale their GTM?`,
    instagram: `🚀 {company} just closed Series {stage}!

{signal}

New funding = new growth opportunities. Smart founders invest in GTM right away.`
  },
  hiring_vp_sales: {
    linkedin: `📈 {company} is actively hiring a VP Sales.

{signal}

This signals aggressive GTM expansion. When leaders invest in sales leadership, they're betting big on revenue growth.

If you help companies scale their go-to-market motion, now's the time to reach out.`,
    instagram: `📈 {company} hiring VP Sales = GTM expansion incoming 🔥`
  },
  new_product_launch: {
    linkedin: `🎯 {company} launched something new!

{signal}

New products require new GTM strategies. Product-led growth + sales-led growth = highest revenue velocity.

What's your approach to multi-channel GTM?`,
    instagram: `🎯 Product launches require GTM refresh. {company} is doing it right.`
  },
  growth_plateau: {
    linkedin: `📊 {company} appears to be at a growth inflection point.

{signal}

Growth plateaus are where GTM strategy makes the difference. The companies that breakthrough are usually the ones who:
✓ Refine their ICP
✓ Optimize sales process
✓ Expand into adjacent segments

What's your growth limiting factor right now?`,
    instagram: `📊 Growth plateau? Time for GTM optimization 📈`
  },
  market_expansion: {
    linkedin: `🌍 {company} is expanding into new markets.

{signal}

Market expansion requires GTM adaptation. New geography = new buyer personas, new channels, new strategies.

Are you helping companies expand successfully?`,
    instagram: `🌍 Market expansion requires GTM adaptation. {company} is making smart moves.`
  }
};

// Generate content from lead signal
async function generateContent(lead) {
  try {
    // Determine content type based on trigger
    const trigger = lead.trigger || 'new_product_launch';
    const template = contentTemplates[trigger] || contentTemplates.new_product_launch;

    // Build content variations
    const linkedinDraft = template.linkedin
      .replace('{company}', lead.business)
      .replace('{signal}', lead.signal)
      .replace('{stage}', 'A/B/C'); // Placeholder

    const instagramDraft = template.instagram
      .replace('{company}', lead.business)
      .replace('{signal}', lead.signal)
      .replace('{stage}', 'A/B/C');

    return {
      lead_id: lead.id,
      business: lead.business,
      trigger,
      signal: lead.signal,
      linkedin_draft: linkedinDraft,
      instagram_draft: instagramDraft,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 day window
    };
  } catch (e) {
    console.error('Content generation error:', e);
    return null;
  }
}

// Store generated content
async function storeContent(contentDrafts) {
  try {
    const { data, error } = await supabase
      .from('content_drafts')
      .insert(contentDrafts);

    if (error) {
      console.error('Error storing content:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: contentDrafts.length, data };
  } catch (e) {
    console.error('Storage error:', e.message);
    return { success: false, error: e.message };
  }
}

// Get recent discovered leads (last 30 days) - enough for weekly batch
async function getRecentLeads() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('gtm_targets')
      .select('*')
      .eq('source_channel', 'discovery')
      .gte('created_at', thirtyDaysAgo)
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Fetch error:', e.message);
    return [];
  }
}

// Main handler - generates 5-7 content pieces for the week
exports.handler = async (event, context) => {
  try {
    console.log('📝 Weekly content batch generation triggered');

    // Get recent leads
    const recentLeads = await getRecentLeads();
    console.log(`📊 Found ${recentLeads.length} recent leads`);

    if (recentLeads.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'success',
          message: 'No recent leads to generate content for',
          content_generated: 0,
          timestamp: new Date().toISOString()
        })
      };
    }

    // Select top 5-7 leads for this week's content (highest confidence, most recent)
    const weeklyLeads = recentLeads.slice(0, 7);
    console.log(`🎯 Selected ${weeklyLeads.length} leads for weekly content batch`);

    // Generate content for selected leads
    const contentDrafts = [];
    for (let i = 0; i < weeklyLeads.length; i++) {
      const lead = weeklyLeads[i];
      const content = await generateContent(lead);
      if (content) {
        // Add schedule info: stagger posts Mon-Fri at 9 AM
        const dayOffset = i % 5; // Cycle through Mon-Fri
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + dayOffset + 1); // Start tomorrow
        scheduleDate.setHours(9, 0, 0, 0); // 9 AM

        content.scheduled_for = scheduleDate.toISOString();
        content.status = 'approved'; // Auto-approve for weekly batch
        contentDrafts.push(content);
      }
    }

    console.log(`📝 Generated ${contentDrafts.length} content drafts for the week`);

    // Store content drafts
    const result = await storeContent(contentDrafts);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'success',
        leads_processed: weeklyLeads.length,
        content_generated: contentDrafts.length,
        stored: result.success,
        scheduled_dates: contentDrafts.map(c => ({
          business: c.business,
          scheduled_for: c.scheduled_for
        })),
        timestamp: new Date().toISOString()
      })
    };
  } catch (e) {
    console.error('Generation error:', e.message);
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
