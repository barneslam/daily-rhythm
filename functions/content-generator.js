const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Mon–Sun 7-day Recovery Sprint schedule
const WEEKLY_SCHEDULE = [
  { channel: 'barneslam_co', dayOffset: 0, theme: 'opportunity_leakage' },        // Mon
  { channel: 'strategy_pitch', dayOffset: 1, theme: 'wasted_lead_gen' },          // Tue
  { channel: 'barneslam_co', dayOffset: 2, theme: 'stalled_proposals' },          // Wed
  { channel: 'strategy_pitch', dayOffset: 3, theme: 'referral_breakdown' },       // Thu
  { channel: 'barneslam_co', dayOffset: 4, theme: 'followup_breakdown' },         // Fri
  { channel: 'instagram', dayOffset: 5, theme: 'case_lesson' },                   // Sat
  { channel: 'barneslam_co', dayOffset: 6, theme: 'founder_reality' },            // Sun
];

const dayPrompts = {
  opportunity_leakage: {
    day: 'Monday',
    theme: 'Opportunity Leakage Pain + Recovery Solution',
    cta: 'Message RECOVER',
    prompt: `Write a LinkedIn post about opportunity leakage and revenue recovery.

Content focus:
- Open with the pain: founders/consultants losing 20-40% of potential revenue through broken follow-up
- Not a sales problem — a rhythm problem. Warm leads exist. The system doesn't.
- Make it emotionally grounded: reference specific abandoned conversations (warm intro that went cold, proposal sitting for 60+ days, referral partner who stopped referring)
- Solution angle: 48-hour diagnosis and system build
- Close with soft CTA: "Message RECOVER if your next customer might already know your name"

Style: Direct, commercially focused, no motivational fluff.
Requirements:
- 150–250 words
- No em dashes
- No bullet points in first 3 lines
- Strong opening (no "I" as first word)
- End with: #RevenueRecovery #SalesLeadership #B2BStrategy #Founder
- Unsplash search query: "founder at desk with laptop and warm leads"`,
  },
  wasted_lead_gen: {
    day: 'Tuesday',
    theme: 'Wasted Lead Gen Spend / Missed Opportunities',
    cta: 'Message RECOVER',
    prompt: `Write a LinkedIn post about the broken ROI of lead generation.

Content focus:
- Pain: paying for leads but conversion is broken. CAC out of control. Lead quality declining.
- But it's not the leads — it's the system. Agencies buying expensive leads then forgetting to follow up.
- Opportunity: those leads are still warm. Recovery is cheaper than new CAC.
- Reference: specific scenario (small team burning $10K/month on leads, converting 5% when 25% is possible)
- Close: "Your conversion problem isn't lead quality — it's follow-up rhythm"

Style: Commercial, grounded in real pain. No hype.
Requirements:
- 150–250 words
- No em dashes
- No bullet points in first 3 lines
- Strong opening
- End with: #LeadGeneration #SalesEfficiency #B2B #GTM
- Unsplash search query: "desk with CRM interface and proposal documents"`,
  },
  stalled_proposals: {
    day: 'Wednesday',
    theme: 'Stalled Proposal Recovery',
    cta: 'Message RECOVER',
    prompt: `Write a LinkedIn post about proposals stuck in late-stage negotiations.

Content focus:
- The pain: proposals sitting in late stage for 30+ days. Deal momentum dies. Sales team guesses next steps.
- Why it happens: no rhythm. No follow-up cadence. No ownership clarity.
- The opportunity: most stalled proposals don't need a new pitch — they need one conversation.
- Specific scenario: consulting firm with $500K in stalled proposals. No clear next step. Client is waiting.
- Frame: recovery vs. diagnosis. Spend 48 hours clearing the bottleneck.

Style: Direct acknowledgment of a real commercial pain point.
Requirements:
- 150–250 words
- No em dashes
- No bullet points in first 3 lines
- Strong opening
- End with: #SalesProcess #ProposalManagement #B2B #RevenueOps
- Unsplash search query: "person looking at proposal document on laptop"`,
  },
  referral_breakdown: {
    day: 'Thursday',
    theme: 'Warm Referrals That Went Quiet',
    cta: 'Message RECOVER',
    prompt: `Write a LinkedIn post about referral relationships breaking down.

Content focus:
- The pain: referral partners give out your name once. If you don't convert, they stop.
- Why it happens: referrals are warm but treated like cold leads. No follow-up system. Lost conversions.
- The opportunity: rebuild trust by converting that referral in 48 hours.
- Specific scenario: consultant with 15 referral partners who stopped referring because close rate was low
- Frame: referral preservation through execution rhythm

Style: Emotionally grounded in lost partnerships and trust.
Requirements:
- 150–250 words
- No em dashes
- No bullet points in first 3 lines
- Strong opening
- End with: #Referrals #PartnershipStrategy #B2B #SalesGrowth
- Unsplash search query: "two people shaking hands or meeting face to face"`,
  },
  followup_breakdown: {
    day: 'Friday',
    theme: 'Follow-Up Breakdown + Recovery Rhythm',
    cta: 'Message RECOVER',
    prompt: `Write a LinkedIn post about broken follow-up systems and how to fix them.

Content focus:
- The pain: team inconsistent with follow-up. Leads fall through cracks. CRM not being used. Warm conversations abandoned.
- Why it happens: no clear rhythm. No ownership. No accountability.
- The opportunity: 48-hour sprint to diagnose the fracture and map the system that prevents it
- Specific scenario: small agency where good leads come in but disappear because no one owns the follow-up
- Frame: follow-up is not soft — it's the operating system

Style: Direct, no sugarcoating the dysfunction.
Requirements:
- 150–250 words
- No em dashes
- No bullet points in first 3 lines
- Strong opening
- End with: #SalesFundamentals #TeamLeadership #B2B #OperationalExcellence
- Unsplash search query: "person at desk working in CRM or email inbox"`,
  },
  case_lesson: {
    day: 'Saturday',
    theme: 'Short Case-Style Lesson',
    cta: 'Link to article or DM',
    prompt: `Write a short Instagram carousel post (1 slide, max 150 words) about a real recovery lesson.

Content focus:
- Pick one real scenario: stalled proposal, cold warm lead, referral that died, forgotten opportunity
- Keep it specific (numbers, context, outcome)
- Extract the one lesson
- Make it inspirational in a commercial way (not motivational fluff — tangible win)

Style: Story-driven, real outcome, specific numbers.
Requirements:
- Max 150 words
- One clear lesson
- Specific outcome
- Conversational tone
- No hashtags (Instagram, not LinkedIn)
- Unsplash search query: "success meeting celebration or handshake"`,
  },
  founder_reality: {
    day: 'Sunday',
    theme: 'Founder Reality / Personal Reflection',
    cta: 'Open reflection',
    prompt: `Write a LinkedIn post as personal reflection from a founder perspective.

Content focus:
- Sunday = less polished, more real
- What's actually hard about managing warm leads and referrals
- A specific challenge or realization from your own experience
- No pitch — pure observation
- Make it relatable to other founders/operators dealing with the same thing

Style: Honest, unfiltered, grounded in reality.
Requirements:
- 150–250 words
- No em dashes
- No bullet points in first 3 lines
- Strong opening
- End with: #FounderLife #Entrepreneurship #B2B #RealTalk
- Unsplash search query: "person thinking or reflecting at desk"`,
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

async function generatePost(theme) {
  const cfg = dayPrompts[theme];
  if (!cfg) throw new Error(`Unknown theme: ${theme}`);

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: cfg.prompt,
    }],
  });
  return msg.content[0].text.trim();
}

async function run(weekStart) {
  const nextMonday = weekStart ? new Date(weekStart) : getNextMonday();
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
      console.log(`  Generating ${slot.channel} ${slot.theme} for ${draft_date}...`);
      const content = await generatePost(slot.theme);

      const title = content.split('\n').find(l => l.trim())?.slice(0, 80) || '';
      const { error } = await supabase.from('gtm_drafts').insert({
        channel: slot.channel,
        theme: slot.theme,
        draft_date,
        title,
        content,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      console.log(`  ✓ ${slot.channel} ${slot.theme} ${draft_date}`);
      results.push({ channel: slot.channel, theme: slot.theme, date: draft_date, status: 'created' });
    } catch (err) {
      console.error(`  ✗ ${slot.channel} ${slot.theme} ${draft_date}: ${err.message}`);
      results.push({ channel: slot.channel, theme: slot.theme, date: draft_date, status: 'failed', error: err.message });
    }
  }

  const created = results.filter(r => r.status === 'created').length;
  console.log(`\n✅ Done — ${created} drafts created for week of ${formatDate(nextMonday)}`);
  return { statusCode: 200, body: JSON.stringify({ week: formatDate(nextMonday), results }) };
}

exports.handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};
  return run(body.weekStart);
};
