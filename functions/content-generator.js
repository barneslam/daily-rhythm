const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Mon–Fri schedule for next week: channel + day offset from next Monday
const WEEKLY_SCHEDULE = [
  { channel: 'the_strategy_pitch', dayOffset: 0 }, // Mon
  { channel: 'axis_chamber',       dayOffset: 1 }, // Tue
  { channel: 'barneslam_co',       dayOffset: 2 }, // Wed
  { channel: 'the_strategy_pitch', dayOffset: 3 }, // Thu
  { channel: 'barneslam_co',       dayOffset: 4 }, // Fri
];

const channelVoice = {
  the_strategy_pitch: {
    name: 'The Strategy Pitch',
    voice: 'A GTM strategist writing for founders and revenue operators at $5M–$50M. Sharp, direct, no fluff. Focus on go-to-market, pipeline, positioning, ICP, sales systems. Use a story hook with a specific client scenario, then extract the lesson. End with a CTA that invites a DM.',
    hashtags: '#GTMStrategy #SalesLeadership #RevenuePlaybook #B2BSales #Founder',
  },
  barneslam_co: {
    name: 'Barnes Lam',
    voice: 'A positioning and leadership advisor for B2B operators. Calm authority, no hype. Write about positioning, execution vs strategy, leadership structure, and market clarity. Open with a bold contrarian claim, develop the reasoning, close with an insight.',
    hashtags: '#Positioning #Leadership #B2BStrategy #ExecutiveThinking',
  },
  axis_chamber: {
    name: 'Axis Chamber',
    voice: 'A performance community for high-growth operators. Write about execution discipline, team performance, delegation, consistency, and operational excellence. Direct and energizing. Challenge the reader to examine their own habits.',
    hashtags: '#HighPerformance #OperationalExcellence #Leadership #Execution',
  },
};

function getNextMonday() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 1=Mon...
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  return nextMonday;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function generatePost(channel) {
  const cfg = channelVoice[channel];
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Write a LinkedIn post for ${cfg.name}.

Voice: ${cfg.voice}

Requirements:
- 150–250 words
- No em dashes
- No bullet points in the first 3 lines
- Strong opening line (no "I" as first word)
- End with: ${cfg.hashtags}
- Do NOT include a subject line or title
- Do NOT include any URLs or website links

Write the post body only.`,
    }],
  });
  return msg.content[0].text.trim();
}

async function run() {
  const nextMonday = getNextMonday();
  console.log(`📅 Generating content for week of ${formatDate(nextMonday)}`);

  const results = [];

  for (const slot of WEEKLY_SCHEDULE) {
    const postDate = new Date(nextMonday);
    postDate.setDate(nextMonday.getDate() + slot.dayOffset);
    const draft_date = formatDate(postDate);

    // Skip if draft already exists for this channel+date
    const { data: existing } = await supabase
      .from('gtm_drafts')
      .select('id')
      .eq('channel', slot.channel)
      .eq('draft_date', draft_date)
      .single();

    if (existing) {
      console.log(`  ⏭ ${slot.channel} ${draft_date} already exists`);
      results.push({ channel: slot.channel, date: draft_date, status: 'skipped' });
      continue;
    }

    try {
      console.log(`  Generating ${slot.channel} for ${draft_date}...`);
      const content = await generatePost(slot.channel);

      const { error } = await supabase.from('gtm_drafts').insert({
        channel: slot.channel,
        draft_date,
        content,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      console.log(`  ✓ ${slot.channel} ${draft_date}`);
      results.push({ channel: slot.channel, date: draft_date, status: 'created' });
    } catch (err) {
      console.error(`  ✗ ${slot.channel} ${draft_date}: ${err.message}`);
      results.push({ channel: slot.channel, date: draft_date, status: 'failed', error: err.message });
    }
  }

  const created = results.filter(r => r.status === 'created').length;
  console.log(`\n✅ Done — ${created} drafts created for week of ${formatDate(nextMonday)}`);
  return { statusCode: 200, body: JSON.stringify({ week: formatDate(nextMonday), results }) };
}

exports.handler = async () => run();
