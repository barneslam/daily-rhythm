#!/usr/bin/env node

/**
 * GTM Content Curation Skill
 * Generates, schedules, tracks, and integrates content across platforms
 * Runs: 20 days/month (Mon-Fri), publishes at 9am ET
 */

const { supabase } = require('./supabase-client');
const fs = require('fs');
const path = require('path');

// Content calendar for 12 months (April 2026 - March 2027)
const CONTENT_CALENDAR = {
  monday: 'thestrategypitch.com',
  tuesday: 'barneslam.co',
  wednesday: 'axis_chamber',
  thursday: 'thestrategypitch.com',
  friday: 'barneslam.co'
};

const PLATFORM_CONFIG = {
  'thestrategypitch.com': {
    id: 'exec-platform',
    color: '#0A66C2',
    focus: 'Execution and sales motion'
  },
  'barneslam.co': {
    id: 'authority-platform',
    color: '#1B4D3E',
    focus: 'Authority and confidence'
  },
  'axis_chamber': {
    id: 'chamber-platform',
    color: '#1B4D3E',
    focus: 'Systems and cadence'
  }
};

/**
 * Main curation flow
 * Called daily by scheduled task at 9am ET
 */
async function curate() {
  try {
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if today is a content day (Mon-Fri)
    if (!CONTENT_CALENDAR[dayOfWeek.toLowerCase()]) {
      console.log(`✓ ${dayOfWeek} — no content scheduled`);
      return;
    }

    const platform = CONTENT_CALENDAR[dayOfWeek.toLowerCase()];
    console.log(`\n📝 Curating content for ${dayOfWeek} — ${platform}`);

    // Step 1: Get or create content piece for today
    const contentPiece = await getOrCreateContentPiece(dayOfWeek, platform);

    if (!contentPiece) {
      console.log('❌ No content piece found for today');
      return;
    }

    // Step 2: Schedule for publishing via Blotato at 9am ET
    await schedulePublish(contentPiece, platform);

    // Step 3: Log to content tracking
    await logContentPublished(contentPiece);

    console.log(`✅ Content scheduled for 9am ET: ${contentPiece.title}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   CTA: DM "${contentPiece.cta_trigger}"`);

  } catch (error) {
    console.error('❌ Curation error:', error.message);
  }
}

/**
 * Get existing content or return draft
 */
async function getOrCreateContentPiece(dayOfWeek, platform) {
  try {
    // Check if today's content is in drafts directory
    const draftPath = path.join(__dirname, 'drafts');
    const draftFiles = fs.readdirSync(draftPath)
      .filter(f => f.includes(dayOfWeek.toLowerCase()));

    if (draftFiles.length === 0) {
      console.log(`⚠️  No draft found for ${dayOfWeek}`);
      return null;
    }

    // Read the draft content
    const draftContent = fs.readFileSync(
      path.join(draftPath, draftFiles[0]),
      'utf8'
    );

    // Parse as markdown content
    return {
      title: extractTitle(draftContent),
      body: draftContent,
      platform: platform,
      day: dayOfWeek,
      cta_trigger: extractCTA(draftContent),
      website_url: extractWebsiteUrl(draftContent),
      status: 'ready_for_publish'
    };

  } catch (error) {
    console.error('Error loading content:', error.message);
    return null;
  }
}

/**
 * Schedule content for publishing at 9am ET
 */
async function schedulePublish(piece, platform) {
  try {
    // Store in Supabase for Blotato webhook to pick up
    const { error } = await supabase
      .from('content_pieces')
      .insert([{
        title: piece.title,
        body: piece.body,
        platform: platform,
        scheduled_time: getNext9amET(),
        status: 'scheduled',
        cta_trigger: piece.cta_trigger,
        website_url: piece.website_url,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Scheduling error:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Failed to schedule:', error.message);
  }
}

/**
 * Log content published for tracking
 */
async function logContentPublished(piece) {
  try {
    const { error } = await supabase
      .from('content_engagement')
      .insert([{
        piece_title: piece.title,
        platform: piece.platform,
        published_at: getNext9amET(),
        engagement_count: 0,
        lead_count: 0,
        status: 'published'
      }]);

    if (error) throw error;

  } catch (error) {
    console.error('Logging error:', error.message);
  }
}

/**
 * Get next 9am ET datetime
 */
function getNext9amET() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  // Convert to ET if needed
  return tomorrow.toISOString();
}

/**
 * Extract title from markdown
 */
function extractTitle(content) {
  const match = content.match(/^# (.+)$/m);
  return match ? match[1] : 'Untitled';
}

/**
 * Extract CTA trigger from content
 */
function extractCTA(content) {
  const match = content.match(/DM me "([^"]+)"/);
  return match ? match[1] : 'ENGAGE';
}

/**
 * Extract website URL from content
 */
function extractWebsiteUrl(content) {
  const match = content.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : '';
}

/**
 * Handle incoming DMs and create leads
 * Called by DM webhook from Blotato
 */
async function handleDMAndCreateLead(dmData) {
  try {
    const { sender_name, sender_email, message_text, source_content_id } = dmData;

    console.log(`\n📬 New DM from ${sender_name}: "${message_text}"`);

    // Step 1: Create lead in dashboard
    const lead = await createLeadFromDM({
      name: sender_name,
      email: sender_email,
      source: 'dm',
      interested_in: message_text,
      content_source_id: source_content_id
    });

    if (lead) {
      // Step 2: Update engagement metrics for content piece
      await updateEngagementMetrics(source_content_id, {
        dm_count: 1,
        lead_created: true
      });

      console.log(`✅ Lead created: ${lead.id} from ${sender_name}`);
      return lead;
    }

  } catch (error) {
    console.error('❌ DM handler error:', error.message);
  }
}

/**
 * Create lead from DM engagement
 */
async function createLeadFromDM(dmData) {
  try {
    const { error, data } = await supabase
      .from('gtm_targets')
      .insert([{
        name: dmData.name,
        status: 'dm_engaged',
        source: dmData.source || 'dm',
        linkedin_url: dmData.linkedin_url || '',
        date_found: new Date().toISOString().split('T')[0],
        notes: `DM message: "${dmData.interested_in}" | Source: ${dmData.content_source_id}`,
        connection_note: dmData.interested_in
      }])
      .select()
      .limit(1)
      .single();

    if (error) {
      console.error('Lead creation error:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('Error creating lead:', error.message);
    return null;
  }
}

/**
 * Update engagement metrics for a content piece
 */
async function updateEngagementMetrics(contentId, metrics) {
  try {
    const { error } = await supabase
      .from('content_engagement')
      .update({
        engagement_count: metrics.dm_count ? 1 : 0,
        lead_count: metrics.lead_created ? 1 : 0,
        updated_at: new Date().toISOString()
      })
      .eq('piece_title', contentId);

    if (error) throw error;

  } catch (error) {
    console.error('Metrics update error:', error.message);
  }
}

/**
 * Get engagement report for month
 */
async function getMonthlyReport() {
  try {
    const { data, error } = await supabase
      .from('content_engagement')
      .select('*')
      .gte('published_at', getMonthStart())
      .order('published_at', { ascending: false });

    if (error) throw error;

    // Calculate summary
    const summary = {
      total_pieces: data.length,
      total_engagement: data.reduce((sum, p) => sum + (p.engagement_count || 0), 0),
      total_leads: data.reduce((sum, p) => sum + (p.lead_count || 0), 0),
      pieces: data
    };

    console.log('\n📊 Monthly Content Report:');
    console.log(`   Content pieces: ${summary.total_pieces}`);
    console.log(`   Total engagement: ${summary.total_engagement}`);
    console.log(`   Leads generated: ${summary.total_leads}`);

    return summary;

  } catch (error) {
    console.error('Report error:', error.message);
    return null;
  }
}

/**
 * Get start of current month
 */
function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'curate':
      curate();
      break;
    case 'report':
      getMonthlyReport();
      break;
    case 'dm':
      // Handle DM: node curation-skill.js dm <json>
      const dmData = JSON.parse(process.argv[3] || '{}');
      handleDMAndCreateLead(dmData);
      break;
    default:
      console.log(`
Usage:
  node curation-skill.js curate              # Generate & schedule today's content
  node curation-skill.js report              # Get monthly engagement report
  node curation-skill.js dm '<json>'         # Process incoming DM
      `);
  }
}

module.exports = {
  curate,
  handleDMAndCreateLead,
  getMonthlyReport
};
