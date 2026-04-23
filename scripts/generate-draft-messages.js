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
 * Run: node scripts/generate-draft-messages.js [--all]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const FORCE_ALL = process.argv.includes('--all');

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

  // Large enterprise C-suite → Axis Chamber (they're peers, not coaching prospects)
  if (aud === 'executive' || aud === 'new_exec') {
    if (/\$[1-9][0-9]+b\b|billion|\$[1-9][0-9]{2}m\b|[1-9][0-9]{2}m revenue|fortune [0-9]|global enterprise|xerox|insight enterprises/.test(txt)) return 'axis_chamber';
    // Mid-market execs → Strategy Pitch
    return 'strategy_pitch';
  }

  // Revenue leaders → Strategy Pitch (commercial focus)
  if (aud === 'revenue_leader') return 'strategy_pitch';

  // Founders & operators → Barnes Lam
  return 'barnes_lam';
}

// ─── Para 1: Observation ──────────────────────────────────────────────────────

function observationParagraph(target) {
  const co = companyName(target.business);
  const signal = target.signal || '';
  const aud = audienceType(signal, target.business);
  const hook = cleanSignalHook(signal);

  // Signal-based openers (highest specificity)
  if (signal) {
    if (/promot|elevated to|stepped into|appointed|named (ceo|cro|coo|cgo|president)|new ceo/i.test(signal)) {
      const roleM = (target.business || '').match(/\b(CEO|CRO|COO|CGO|President|Chief[\w\s]+Officer|Managing Director)\b/i)
        || signal.match(/\b(CEO|CRO|COO|CGO|President|Chief[\w\s]+Officer|Managing Director)\b/i);
      const role = roleM ? roleM[1] : 'the role';
      const coDisplay = co === 'your company' ? 'the company' : co;
      return `I've been following the transition at ${coDisplay} — stepping into ${role} is one of the highest-leverage moments in a company's trajectory, and the execution model you build in the first 90 days sets the ceiling.`;
    }
    if (/hiring|vp sales|head of sales|first (ae|sdr|account exec)|sales (team|leader|hire)/i.test(signal)) {
      return `I've been following ${co}'s growth — the decision to build a sales function is the moment most founders discover the GTM architecture needs to exist before the hire can run on it.`;
    }
    if (/series [abcde]|raised|funding round|just raised|secured [\$£€]/i.test(signal)) {
      return `I've been following ${co}'s trajectory — post-raise, the question shifts from "can we get customers" to "can we build the machine that gets them consistently." Most teams have strategy; the execution layer is where the gap opens.`;
    }
    if (/new (product|service|offering|launch)|product launch/i.test(signal)) {
      return `I've been following the work at ${co} — bringing a new offer to market is where GTM assumptions get tested in real time, and most operators try to run the new offer through the old motion.`;
    }
    if (/expand|new market|international|new region|entering.*market/i.test(signal)) {
      return `I've been following the expansion work at ${co} — entering a new market exposes the gaps in the underlying GTM model that existing customers had been masking.`;
    }
    if (/dual exec|cmo.*cro|cro.*cmo|new cmo|new cro|cmo.*hire|cro.*hire/i.test(signal)) {
      return `I've been following the executive buildout at ${co} — a dual CMO/CRO hire signals a commercial rebuild in motion, and the architecture between those two roles is where most GTM execution breaks down.`;
    }
    if (hook) {
      return `I've been following your work — ${hook.replace(/^[A-Z]/, c => c.toLowerCase())}. That's the kind of operating shift most leaders are still working out in real time.`;
    }
  }

  // Audience-based fallbacks
  switch (aud) {
    case 'board':
      return `I've been following your work — the intersection of board-level governance and real operating performance is a gap most organizations are still trying to close.`;
    case 'coach_consultant':
      return `I've been following your work — practitioners who've been in the seat and built the commercial system tend to bring something that pure advisory never does.`;
    case 'revenue_leader':
      return `I've been following your work at ${co} — the gap between revenue strategy and what the team actually executes daily is where most growth mandates stall, and very few executives are positioned to diagnose it clearly.`;
    case 'new_exec':
      return `I've been following the leadership transition at ${co} — the first 90 days in a new seat is where the execution model either gets designed or inherited, and the difference shows up 12 months later.`;
    case 'founder':
      return `I've been following the work at ${co} — at your stage, the commercial architecture and the product are both getting stress-tested at the same time.`;
    case 'executive':
      return `I've been following your work at ${co} — at that level, the alignment between strategic direction and the daily operating layer is one of the few things that actually moves the needle.`;
    default:
      return `I've been following your work at ${co} — the distance between a well-designed strategy and a working commercial machine is something very few operators talk about honestly.`;
  }
}

// ─── Para 2: What Barnes is building ─────────────────────────────────────────

function buildingParagraph(target) {
  const p2 = para2Type(target.signal || '', target.business || '');
  const co = companyName(target.business);
  const aud = audienceType(target.signal || '', target.business || '');

  switch (p2) {
    case 'axis_chamber':
      return `I'm building Axis Chamber — a private forum for board directors and operating partners focused on aligning executive decision-making with real performance outcomes.`;

    case 'strategy_pitch':
      if (aud === 'revenue_leader') {
        return `I run The Strategy Pitch — a commercial pressure-test for revenue leaders. One structured session that surfaces where the GTM architecture breaks down between strategy and what the team actually executes, and what to do about it.`;
      }
      return `I run The Strategy Pitch — a structured commercial review for executives navigating transformation, a new seat, or a growth inflection. One session that identifies the real constraints between strategy and execution, and builds the model to close them.`;

    case 'barnes_lam':
    default:
      if (aud === 'founder') {
        return `At barneslam.co, I work with founders to fix broken GTM and turn strategy into revenue — specifically the point where the commercial model needs to be rebuilt, not just optimized.`;
      }
      return `At barneslam.co, I help operators fix broken GTM and turn strategy into revenue — specifically the execution gap where positioning, pipeline, and daily rhythm break down despite solid product-market fit.`;
  }
}

// ─── Para 3: Why connect ──────────────────────────────────────────────────────

function connectParagraph(target) {
  const p2 = para2Type(target.signal || '', target.business || '');
  const aud = audienceType(target.signal || '', target.business || '');
  const co = companyName(target.business);
  const coSafe = (!co || co.length < 3 || co === 'your company') ? 'the company' : co;

  if (p2 === 'axis_chamber') {
    if (aud === 'board') return `Given your work at that level, I'd value connecting and exchanging perspectives.`;
    if (aud === 'coach_consultant') return `Given your work developing leaders at that level, I'd value connecting and exchanging perspectives.`;
    return `Given where you sit, I'd value connecting and comparing notes on what's actually moving the needle.`;
  }

  if (p2 === 'strategy_pitch') {
    if (aud === 'new_exec') return `Given where you are in the ${coSafe} transition, I'd value connecting and comparing notes.`;
    if (aud === 'revenue_leader') return `Given your mandate at ${coSafe}, I think there's a useful conversation to be had.`;
    return `Given your work at ${coSafe}, I'd value connecting and exchanging perspectives.`;
  }

  // Barnes Lam
  if (aud === 'founder') return `Given where you are in building ${coSafe}, I'd value connecting and exchanging what's actually working.`;
  return `Given your work at ${coSafe}, I'd value connecting and exchanging perspectives.`;
}

// ─── Assemble ─────────────────────────────────────────────────────────────────

function buildMessage(target) {
  const name = fullName(target.name);
  const p1 = observationParagraph(target);
  const p2 = buildingParagraph(target);
  const p3 = connectParagraph(target);
  return `Hi ${name} —\n\n${p1}\n\n${p2}\n\n${p3}\n\n— Barnes`;
}

function isStale(msg) {
  if (!msg) return true;
  if (msg.includes("I've been impressed")) return true;
  if (msg.includes('calendly.com')) return true;
  if (msg.includes('90-minute diagnostic') && !msg.includes('— Barnes')) return true;
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
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
