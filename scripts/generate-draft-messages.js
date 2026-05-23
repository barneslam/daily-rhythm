#!/usr/bin/env node
/**
 * Batch-generates Barnes Lam connection request drafts for gtm_targets.
 *
 * Format (matches real sent example — Mickey Moss):
 *   Hi [Full Name] —
 *
 *   [Para 1] Specific observation about their work/signal/role
 *   [Para 2] What Barnes is building — ONE of three angles:
 *              axis_chamber   → board/governance/senior leadership dev
 *              strategy_pitch → commercial strategy, mid-market execs, revenue leaders
 *              barnes_lam     → operators, founders, SMB CEOs, GTM coaches
 *   [Para 3] Why connecting makes sense
 *
 *   — Barnes
 *
 * Run:
 *   node scripts/generate-draft-messages.js [--all]          # static templates for all/stale
 *   node scripts/generate-draft-messages.js --high-conf      # AI-personalised for 80/90 targets
 *   node scripts/generate-draft-messages.js --high-conf --all # AI for ALL 80/90 (force refresh)
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const FORCE_ALL = process.argv.includes('--all');
const HIGH_CONF_AI = process.argv.includes('--high-conf');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fullName(name) { return (name || 'there').trim(); }

function firstName(name) {
  if (!name) return 'there';
  return name.split(/[\s,\.]/)[0].replace(/[^a-zA-Z'-]/g, '') || name.trim();
}

function companyName(business) {
  if (!business) return 'your company';
  // Strip everything after em dash
  const beforeDash = business.split(/\s*[—–]\s*/)[0].trim();
  // Strip role prefix: "CEO, Company" or "Founder & CEO, Company"
  const rolePrefix = /^(CEO|CRO|COO|CMO|CFO|CTO|CGO|Founder|Co-?Founder|President|Chairman|Managing Director|Chief[\w\s]+Officer|VP[\s\w]{1,20}|Head of[\s\w]{1,20}|GM|SVP|EVP|Partner|Principal)[,\s&]+/i;
  const m = beforeDash.match(rolePrefix);
  if (m) {
    // Take only the first "word group" — stop at the next comma
    const rest = beforeDash.slice(m[0].length).split(',')[0].trim();
    return rest || beforeDash;
  }
  return beforeDash;
}

function cleanSignalHook(signal) {
  if (!signal) return null;
  const s = signal.split(/[.!\n]/)[0].replace(/\s+/g, ' ').trim();
  if (s.length < 20 || s.length > 130) return null;
  // Skip raw LinkedIn bio openings (role title at company)
  if (/^(CEO|CRO|COO|CMO|CFO|CTO|CGO|Founder|Co-?Founder|President|Chairman|Managing|Chief|VP\s|Head of|Director|Owner|GM\b|SVP|EVP)/i.test(s)) return null;
  return s;
}

// ─── Audience & Para-2 type ───────────────────────────────────────────────────

function audienceType(signal, business) {
  const txt = ((signal || '') + ' ' + (business || '')).toLowerCase();
  if (/board chair|board director|board of trustees|board member|non.?exec|governing board|chairm|vice chair/.test(txt)) return 'board';
  if (/\bcro\b|chief revenue|vp sales|head of sales|revenue leader|chief commercial/.test(txt)) return 'revenue_leader';
  if (/\bcmo\b|chief marketing|vp market|head of market/.test(txt)) return 'revenue_leader';
  if (/new ceo|new coo|new cgo|promoted to ceo|elevated to ceo|stepped into ceo|appointed ceo|named ceo|first year as ceo/.test(txt)) return 'new_exec';
  if (/\bcoach\b|facilitator|trainer|coaching|leadership develop|organizational develop|executive develop|life coach|keynote|speaker|mentor\b|mcc\b/.test(txt)) return 'coach_consultant';
  if (/founder|co.?founder|solo founder|building.*startup|early.?stage/.test(txt)) return 'founder';
  if (/\bceo\b|president|managing director|chief exec/.test(txt)) return 'executive';
  return 'operator';
}

// Para 2 type: axis_chamber | strategy_pitch | barnes_lam
function para2Type(signal, business) {
  const txt = ((signal || '') + ' ' + (business || '')).toLowerCase();
  const aud = audienceType(signal, business);

  // Axis Chamber — only for genuine board/governance level OR senior leadership dev practitioners
  if (aud === 'board') return 'axis_chamber';
  if (aud === 'coach_consultant') {
    // Only leadership/org-dev coaches who serve C-suite/boards get Axis Chamber
    if (/\bboard\b|governance|c-suite|organizational|org develop|executive coach|leadership develop|mcc\b|corporate leader/.test(txt)) return 'axis_chamber';
    // Business/revenue/sales coaches → Barnes Lam
    return 'barnes_lam';
  }

  // CEOs: Axis only if large enterprise or governance-focused
  // Default: execution-oriented operator CEO → Barnes Lam
  if (aud === 'executive' || aud === 'new_exec') {
    const isLargeEnterprise = /\$[1-9][0-9]+b\b|billion|\$[1-9][0-9]{2}m\b|[1-9][0-9]{2}m revenue|fortune [0-9]|global enterprise|xerox|insight enterprises/.test(txt);
    const isGovernance = /board chair|board of director|board member|governance|non.?exec|chairm|vice chair/.test(txt);
    if (isLargeEnterprise || isGovernance) return 'axis_chamber';
    return 'barnes_lam';
  }

  // Revenue leaders → Strategy Pitch (commercial focus)
  if (aud === 'revenue_leader') return 'strategy_pitch';

  // Founders & operators → Barnes Lam
  return 'barnes_lam';
}

// ─── Compact observation (~90 chars) ─────────────────────────────────────────

function compactObs(target, co, aud) {
  const signal = target.signal || '';
  const hook = cleanSignalHook(signal);
  const cd = (co === 'your company') ? 'the company' : co;

  if (signal) {
    if (/promot|elevated to|stepped into|appointed|named (ceo|cro|coo|cgo|president)|new ceo/i.test(signal)) {
      const rm = ((target.business || '') + ' ' + signal).match(/\b(CEO|CRO|COO|CGO|President|Chief[\w\s]+Officer)\b/i);
      const role = rm ? rm[1] : 'the role';
      return `Seen the shift at ${cd} — stepping into ${role} is where execution models get built or inherited.`;
    }
    if (/hiring|vp sales|head of sales|first (ae|sdr|account exec)|sales (team|leader|hire)/i.test(signal)) {
      return `Seen ${cd}'s growth — GTM architecture needs to exist before the sales hire can run on it.`;
    }
    if (/series [abcde]|raised|funding round|just raised|secured [\$£€]/i.test(signal)) {
      return `Post-raise at ${cd}, the question shifts from getting customers to building the machine that does it consistently.`;
    }
    if (/new (product|service|offering|launch)|product launch/i.test(signal)) {
      return `Seen the work at ${cd} — new offers expose the GTM assumptions existing customers had masked.`;
    }
    if (/expand|new market|international|new region|entering.*market/i.test(signal)) {
      return `Seen the expansion at ${cd} — new markets expose gaps the existing base had been covering.`;
    }
    if (/dual exec|cmo.*cro|cro.*cmo|new cmo|new cro/i.test(signal)) {
      return `Seen the commercial rebuild at ${cd} — the architecture between CMO and CRO is where GTM execution usually breaks.`;
    }
    if (hook) return `Seen your work — ${hook.replace(/^[A-Z]/, c => c.toLowerCase())}.`;
  }

  switch (aud) {
    case 'board':            return `Seen your governance work — the gap between board-level decisions and operating execution is where most strategy gets lost.`;
    case 'coach_consultant': return `Seen your work — operators who've built the commercial system bring something pure advisory doesn't.`;
    case 'revenue_leader':   return `Seen your work at ${cd} — the gap between revenue strategy and what the team runs on is rarely where people expect it.`;
    case 'new_exec':         return `Seen the shift at ${cd} — first 90 days is where the execution model gets designed or inherited.`;
    case 'founder':          return `Seen the work at ${cd} — at this stage, GTM and product get stress-tested at the same time.`;
    case 'executive':        return `Seen your work at ${cd} — strategy-to-execution alignment is where real operating leverage lives.`;
    default:                 return `Seen your work at ${cd} — most growth mandates stall in the gap between strategy and daily execution.`;
  }
}

// ─── Compact building (~75 chars) ────────────────────────────────────────────

function compactBld(p2, aud, signal) {
  const sig = (signal || '').toLowerCase();
  switch (p2) {
    case 'axis_chamber':
      return `Working with board directors and operators on governance meeting real commercial performance.`;
    case 'strategy_pitch':
      if (aud === 'revenue_leader') return `Working with revenue leaders on the GTM strategy-to-execution gap.`;
      if (aud === 'new_exec')       return `Working with new executives on the execution model that makes strategy stick.`;
      return `Working with executives on closing the gap between commercial strategy and execution.`;
    case 'barnes_lam':
    default:
      if (/ai|saas|tech|software|platform|agentic|automation/i.test(sig)) {
        return `Working with founders on AI-driven GTM systems and execution layers.`;
      }
      if (aud === 'founder') return `Working with founders on GTM architecture — positioning, pipeline, and daily execution rhythm.`;
      return `Working with operators on the execution layer between strategy and revenue.`;
  }
}

// ─── Assemble ─────────────────────────────────────────────────────────────────

const CHAR_LIMIT = 250;
const CLOSE = ' Would be great to connect. — Barnes';

function buildMessage(target) {
  const name = fullName(target.name);
  const co = companyName(target.business);
  const aud = audienceType(target.signal || '', target.business || '');
  const p2 = para2Type(target.signal || '', target.business || '');

  const prefix = `Hi ${name} — `;
  const obs = compactObs(target, co, aud);
  const bld = compactBld(p2, aud, target.signal || '');

  const full = prefix + obs + ' ' + bld + CLOSE;
  if (full.length <= CHAR_LIMIT) return full;

  // Drop building sentence if obs alone fits cleanly
  const obsOnly = prefix + obs + CLOSE;
  if (obsOnly.length <= CHAR_LIMIT) return obsOnly;

  // Last resort: trim at word boundary
  const maxBody = CHAR_LIMIT - prefix.length - CLOSE.length;
  const trimmed = (obs + ' ' + bld).slice(0, maxBody).replace(/\s+\S*$/, '');
  console.warn(`  ⚠ Trimmed: ${target.name} — ${full.length} chars`);
  return prefix + trimmed + CLOSE;
}

function isStale(msg) {
  if (!msg) return true;
  if (msg.includes("I've been impressed")) return true;
  if (msg.includes('calendly.com')) return true;
  if (msg.includes('90-minute diagnostic') && !msg.includes('— Barnes')) return true;
  return false;
}

// ─── AI generation for high-confidence targets ────────────────────────────────

const PLATFORM_CONTEXT = {
  axis_chamber: {
    label: 'Axis Chamber',
    description: 'brings together board directors and senior operating partners for candid dialogue on where governance meets real commercial performance'
  },
  strategy_pitch: {
    label: 'The Strategy Pitch',
    description: 'works with mid-market executives and revenue leaders on closing the gap between commercial strategy and what the team actually executes'
  },
  barnes_lam: {
    label: 'Barnes Lam',
    description: 'works with founders and operators on rebuilding GTM from the commercial layer — positioning, pipeline architecture, and the daily execution rhythm that turns a working offer into predictable revenue'
  }
};

async function generateAIMessage(target) {
  const p2 = para2Type(target.signal || '', target.business || '');
  const aud = audienceType(target.signal || '', target.business || '');
  const platform = PLATFORM_CONTEXT[p2];
  const staticDraft = buildMessage(target);

  const prompt = `Write a LinkedIn connection request note for Barnes Lam to send to ${fullName(target.name)}.

About this person:
- Role/Business: ${target.business || 'unknown'}
- Signal/Context: ${target.signal || 'B2B operator or executive'}
- Audience type: ${aud}
- Platform fit: ${platform.label} — ${platform.description}

Format — single compact message, no line breaks:
Hi ${fullName(target.name)} — [specific observation about their work or signal, ~80 chars] [what Barnes is currently working on matching their platform fit, ~70 chars] Would be great to connect. — Barnes

Rules:
- HARD LIMIT: 250 characters total (count carefully)
- Single flowing sentence structure — no paragraph breaks
- Observation must be specific to their signal or role context
- "Working on/with..." framing for Barnes's work — do NOT name platform products
- Peer tone, not salesy
- End with exactly: "Would be great to connect. — Barnes"
- Return only the message text — no quotes, no preamble

Reference draft (for tone only — write a tighter, more specific version):
${staticDraft}`;

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  const msg = res.content[0].text.trim();
  const wc = wordCount(msg);
  if (wc > WORD_LIMIT) console.warn(`  ⚠ AI message over limit: ${target.name} — ${wc} words`);
  return msg;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  if (HIGH_CONF_AI) {
    console.log('AI mode — fetching 80/90 confidence targets...\n');
    const { data: allTargets, error: err } = await supabase
      .from('gtm_targets')
      .select('id, name, business, signal, draft_message, confidence')
      .in('confidence', ['HIGH', 'MEDIUM-HIGH'])
      .order('confidence', { ascending: false });

    if (err) { console.error('Fetch error:', err.message); process.exit(1); }

    const toProcess = FORCE_ALL ? allTargets : allTargets.filter(t => isStale(t.draft_message));
    console.log(`${allTargets.length} high-conf targets — ${toProcess.length} to AI-generate${FORCE_ALL ? ' (--all)' : ''}\n`);

    let updated = 0, failed = 0;
    for (const t of toProcess) {
      try {
        const msg = await generateAIMessage(t);
        const p2 = para2Type(t.signal || '', t.business || '');
        const { error: upErr } = await supabase
          .from('gtm_targets')
          .update({ draft_message: msg, needs_regen: false, updated_at: new Date().toISOString() })
          .eq('id', t.id);

        if (upErr) { console.error(`  ✗ ${t.name} — ${upErr.message}`); failed++; }
        else { console.log(`  ✓ ${t.name}  [${t.confidence} → ${p2}]`); updated++; }
      } catch (e) {
        console.error(`  ✗ ${t.name} — AI error: ${e.message}`);
        failed++;
      }
    }
    console.log(`\nDone. AI-updated: ${updated} | Failed: ${failed}`);
    return;
  }

  console.log('Fetching targets...\n');
  const { data: targets, error } = await supabase
    .from('gtm_targets')
    .select('id, name, business, signal, draft_message')
    .order('id');

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }

  const toFix = FORCE_ALL ? targets : targets.filter(t => isStale(t.draft_message));
  console.log(`${targets.length} total — ${toFix.length} to update${FORCE_ALL ? ' (--all)' : ''}\n`);

  let updated = 0, failed = 0;
  for (const t of toFix) {
    const msg = buildMessage(t);
    const p2 = para2Type(t.signal || '', t.business || '');
    const { error: upErr } = await supabase
      .from('gtm_targets')
      .update({ draft_message: msg, needs_regen: false, updated_at: new Date().toISOString() })
      .eq('id', t.id);

    if (upErr) { console.error(`  ✗ ${t.name} — ${upErr.message}`); failed++; }
    else { console.log(`  ✓ ${t.name}  [${audienceType(t.signal||'',t.business||'')} → ${p2}]`); updated++; }
  }
  console.log(`\nDone. Updated: ${updated} | Failed: ${failed}`);
}

run();
