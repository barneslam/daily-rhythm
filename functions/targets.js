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

function generateStaticMessage(target) {
  const fn = firstName(target.name);
  const co = companyName(target.business);
  const bizLower = (target.business || '').toLowerCase();
  const type = classifySignal(target.signal, target.business);
  const hook = target.signal ? target.signal.split(/[.!]\s+/)[0].trim() : null;

  switch (type) {
    case 'new_role': {
      const roleMatch = ((target.signal || '') + ' ' + (target.business || '')).match(/\b(CEO|CRO|COO|CGO|President|Founder|Co-Founder|Managing Director|Chief[\w\s]+Officer)\b/i);
      const role = roleMatch ? roleMatch[1] : 'your new role';
      return `${fn} — stepping into ${role} is where the execution model either gets built or deferred. Most new leaders inherit a GTM motion that worked in a different context. The gap between outsider clarity and the org's daily execution is where most transitions stall.\n\nI run a 90-minute diagnostic for executives in their first 90 days — you walk out knowing exactly where the execution gaps are and what to close first.\n\n${CALENDLY}`;
    }
    case 'hiring_sales':
      return `${fn} — the moment you bring in a VP Sales or first AE is when the GTM model gets stress-tested. Most founders discover the system the hire is supposed to run doesn't exist yet.\n\nI help operators at ${co} build the execution model before the hire arrives, so you're not paying a sales leader to build the machine from scratch.\n\n90 minutes. One session. ${CALENDLY}`;
    case 'funding':
      return `${fn} — post-raise, the pressure shifts from "can we get customers" to "can we build the machine that gets them consistently." Most teams have strategy. The execution layer — daily rhythm, pipeline architecture, GTM sequencing — is where the gap is.\n\nI work with operators after a funding event specifically on that transition.\n\n90-minute diagnostic. ${CALENDLY}`;
    case 'new_product':
      return `${fn} — new product launches expose the GTM assumptions that existing customers masked. Positioning, pricing, and ICP all need to reset, and most operators try to run the new offer through the old motion.\n\nI work at that exact transition — rebuilding the GTM architecture so the new offer gets a machine that actually fits it.\n\nWorth 15 minutes? ${CALENDLY}`;
    case 'plateau':
      return `${fn} — revenue plateau after initial growth is almost never a sales problem. It's a GTM architecture problem: positioning has drifted, pricing is misaligned, or the sequencing breaks before it reaches qualified buyers.\n\nI diagnose and fix that layer — not surface metrics, the structural gaps that keep the pipeline from compounding.\n\n${CALENDLY}`;
    case 'expansion':
      return `${fn} — entering a new market usually exposes the cracks in your current GTM model. ICP assumptions don't transfer, pricing doesn't hold, and the motion that worked in your base market stalls.\n\nI work at that transition — ICP clarity, pricing alignment, and GTM sequencing rebuilt for the new context.\n\n${CALENDLY}`;
    case 'transformation':
      return `${fn} — AI changes the competitive landscape. It doesn't change the execution gap between strategy and revenue. Most operators end up with a transformed vision and an unchanged daily machine.\n\nI work at that layer — building the operating rhythm that turns a new direction into consistent commercial output.\n\n90-minute diagnostic: ${CALENDLY}`;
    default: {
      if (hook && hook.length >= 20 && hook.length <= 150) {
        return `${fn} — ${hook.toLowerCase().replace(/^i /, 'you ').replace(/^we /, 'you ')}. That's the inflection point where most operators discover the GTM motion needs rebuilding, not just more activity.\n\nI work at the gap between strategy and revenue execution — positioning, pipeline architecture, and daily rhythm for operators at your stage.\n\n15 minutes to see if it's relevant: ${CALENDLY}`;
      }
      if (/saas|software|platform|app/.test(bizLower))
        return `${fn} — at ${co}, the gap is usually not product-market fit. It's GTM architecture: why pipeline isn't predictable, why deals stall before they close, and why the motion doesn't compound.\n\nI diagnose and rebuild that layer for SaaS operators at your stage.\n\n${CALENDLY}`;
      if (/service|consult|agency|advisor/.test(bizLower))
        return `${fn} — services revenue plateaus when positioning is doing too much heavy lifting and the sales motion hasn't been systematized. I rebuild the commercial architecture — positioning, pricing, and pipeline in sequence.\n\n${CALENDLY}`;
      return `${fn} — at ${co}, the constraint is rarely strategy or market. It's the execution layer between knowing what to do and the daily machine that does it.\n\nI work with operators at $2M–$50M specifically on that gap — GTM architecture, positioning clarity, and revenue execution rhythm.\n\n15 minutes to see if it applies: ${CALENDLY}`;
    }
  }
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
      const updates = needsMessage.map(t => ({
        id: t.id,
        draft_message: generateStaticMessage(t),
        updated_at: new Date().toISOString(),
      }));

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
