const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const CALENDLY = 'https://calendly.com/barnes-lam/free-consultation-24-hour-business-sprint';

function firstName(name) {
  if (!name) return 'there';
  return name.split(/[\s,\.]/)[0].replace(/[^a-zA-Z'-]/g, '') || name;
}

function companyName(business) {
  if (!business) return 'your company';
  return business.split(/\s*[—|,–]\s*/)[0].trim();
}

function classifySignal(signal, business) {
  const txt = ((signal || '') + ' ' + (business || '')).toLowerCase();
  if (/promot|appointed|new ceo|new cro|new coo|elevated to|stepped into|joined as|named (ceo|cro|coo|cgo|president)|first year as/.test(txt)) return 'new_role';
  if (/hiring|first (sales|ae|sdr|account exec)|vp sales|head of sales|building.*sales team|sales hire/.test(txt)) return 'hiring_sales';
  if (/series [abcde]|raised|funding round|just raised|secured [\$£€]|investment round/.test(txt)) return 'funding';
  if (/new (product|service|offering|launch)|launching|product launch|new vertical/.test(txt)) return 'new_product';
  if (/plateau|stall|flat revenue|slow growth|revenue stuck|not growing/.test(txt)) return 'plateau';
  if (/new market|geographic expand|international|new region|entering.*market/.test(txt)) return 'expansion';
  if (/ai disruption|digital transform|ai shift|automat|restructur|pivot/.test(txt)) return 'transformation';
  return 'general';
}

const CHAR_LIMIT = 250;
const CLOSE = ' Would be great to connect. — Barnes';

function generateStaticMessage(target) {
  const name = (target.name || 'there').trim();
  const co = companyName(target.business);
  const cd = (co === 'your company') ? 'the company' : co;
  const sig = (target.signal || '').toLowerCase();
  const biz = (target.business || '').toLowerCase();
  const type = classifySignal(target.signal, target.business);

  let obs, bld;

  switch (type) {
    case 'new_role': {
      const rm = ((target.business || '') + ' ' + (target.signal || '')).match(/\b(CEO|CRO|COO|CGO|President|Chief[\w\s]+Officer)\b/i);
      const role = rm ? rm[1] : 'the role';
      obs = `Seen the shift at ${cd} — stepping into ${role} is where execution models get built or inherited.`;
      bld = `Working with new executives on the execution model that makes strategy stick.`;
      break;
    }
    case 'hiring_sales':
      obs = `Seen ${cd}'s growth — GTM architecture needs to exist before the sales hire can run on it.`;
      bld = `Working with founders on building the execution layer before the commercial hire arrives.`;
      break;
    case 'funding':
      obs = `Post-raise at ${cd}, the question shifts from getting customers to building the machine that does it consistently.`;
      bld = `Working with operators on the execution layer that makes post-raise growth compound.`;
      break;
    case 'new_product':
      obs = `Seen the work at ${cd} — new offers expose the GTM assumptions existing customers had masked.`;
      bld = `Working with operators on rebuilding GTM architecture so new offers get a motion that fits.`;
      break;
    case 'plateau':
      obs = `Seen your work at ${cd} — revenue plateau is almost never a sales problem; it's GTM architecture.`;
      bld = `Working with operators on the structural gaps that keep pipeline from compounding.`;
      break;
    case 'expansion':
      obs = `Seen the expansion at ${cd} — new markets expose gaps the existing base had been covering.`;
      bld = `Working with operators on ICP clarity, pricing alignment, and GTM sequencing for new contexts.`;
      break;
    case 'transformation':
      obs = `Seen the shift at ${cd} — AI changes the landscape; it doesn't close the strategy-to-execution gap.`;
      bld = `Working with operators on the execution layer that turns a new direction into consistent revenue.`;
      break;
    default:
      if (/ai|saas|tech|software|platform|agentic|automation/.test(sig + ' ' + biz)) {
        obs = `Seen your work at ${cd} — the execution layer between AI tools and real GTM output is where most teams stall.`;
        bld = `Working with founders on AI-driven GTM systems and execution infrastructure.`;
      } else if (/board chair|board director|board member|non.?exec|chairm/i.test(sig + ' ' + biz)) {
        obs = `Seen your governance work — the gap between board decisions and operating execution is where strategy gets lost.`;
        bld = `Working with board directors and operators on governance meeting real commercial performance.`;
      } else if (/\bcro\b|chief revenue|vp sales|head of sales/.test(sig + ' ' + biz)) {
        obs = `Seen your work at ${cd} — the gap between revenue strategy and what the team runs on is rarely where people expect.`;
        bld = `Working with revenue leaders on the GTM strategy-to-execution gap.`;
      } else if (/founder|co.?founder/.test(sig + ' ' + biz)) {
        obs = `Seen the work at ${cd} — at this stage, GTM and product get stress-tested at the same time.`;
        bld = `Working with founders on GTM architecture — positioning, pipeline, and daily execution rhythm.`;
      } else {
        obs = `Seen your work at ${cd} — most growth mandates stall in the gap between strategy and daily execution.`;
        bld = `Working with operators on the execution layer between strategy and revenue.`;
      }
  }

  const prefix = `Hi ${name} — `;
  const full = prefix + obs + ' ' + bld + CLOSE;
  if (full.length <= CHAR_LIMIT) return full;

  const obsOnly = prefix + obs + CLOSE;
  if (obsOnly.length <= CHAR_LIMIT) return obsOnly;

  const maxBody = CHAR_LIMIT - prefix.length - CLOSE.length;
  const trimmed = (obs + ' ' + bld).slice(0, maxBody).replace(/\s+\S*$/, '');
  return prefix + trimmed + CLOSE;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS };

  try {
    const { data: targets, error } = await supabase
      .from('gtm_targets')
      .select('*')
      .order('confidence', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const needsMessage = (targets || []).filter(t =>
      !t.draft_message ||
      t.draft_message.includes("I've been impressed") ||
      (t.draft_message.startsWith('Hi ') && t.draft_message.includes("I've been impressed"))
    );

    if (needsMessage.length > 0) {
      const updates = needsMessage.map(t => {
        const msg = generateStaticMessage(t);
        if (msg.length > CHAR_LIMIT) console.warn(`Char limit exceeded: ${t.name} — ${msg.length} chars`);
        return { id: t.id, draft_message: msg, updated_at: new Date().toISOString() };
      });

      for (const update of updates) {
        await supabase
          .from('gtm_targets')
          .update({ draft_message: update.draft_message, updated_at: update.updated_at })
          .eq('id', update.id);
        const tgt = targets.find(t => t.id === update.id);
        if (tgt) tgt.draft_message = update.draft_message;
      }
    }

    const formatted = (targets || []).map(t => ({
      id: t.id,
      name: t.name || t.business,
      business: t.business,
      signal: t.signal,
      channel: t.outreach_channel || 'LinkedIn',
      status: t.status || 'identified',
      confidence: t.confidence || 70,
      linkedin_url: t.linkedin_url,
      qualified: t.qualified || false,
      draft_message: t.draft_message,
      needs_regen: t.needs_regen,
      follow_ups: t.follow_ups,
      notes: t.notes,
      closing_stage: t.closing_stage,
    }));

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ targets: formatted }) };
  } catch (err) {
    console.error('Targets API error:', err.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message, targets: [] }) };
  }
};
