#!/usr/bin/env node
/**
 * restore-leads.js
 * Pushes all known leads from target-list.json into Supabase gtm_targets table.
 * Run:  node restore-leads.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qiwdgyilhwkndqkgqruf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  console.error('ERROR: Set SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Map target-list.json → gtm_targets schema ──────────────────────────────
function mapTarget(t) {
  // Infer qualified from confidence
  const confidence = (t.confidence || '').toUpperCase();
  const qualified  = confidence.startsWith('HIGH');

  // Priority score
  const priority = confidence === 'HIGH' ? 85
    : confidence.startsWith('MEDIUM-HIGH') ? 70
    : confidence.startsWith('MEDIUM') ? 55
    : 40;

  return {
    name:           t.name,
    business:       t.business || '',
    source:         t.source   || null,
    platform:       t.platform || null,
    linkedin_url:   t.linkedin_url || null,
    qualified,
    qual_reason:    t.signal ? t.signal.substring(0, 200) : null,
    signal:         t.signal  || null,
    priority,
    status:         t.status  || 'identified',
    date_found:     t.date_found || null,
    date_messaged:  t.date_messaged || null,
    follow_ups:     t.follow_ups   || 0,
    response:       t.response     || null,
    outreach_channel: t.outreach_channel || null,
  };
}

async function restoreLeads() {
  // ── 1. Load local target list ──────────────────────────────────────────
  const targetPath = path.join(__dirname, 'target-list.json');
  if (!fs.existsSync(targetPath)) {
    console.error('target-list.json not found');
    process.exit(1);
  }
  const { targets } = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  console.log(`\n📋 Loaded ${targets.length} leads from target-list.json`);

  // ── 2. Check existing records to avoid duplicates ─────────────────────
  const { data: existing } = await sb
    .from('gtm_targets')
    .select('name, business');

  const existingKeys = new Set(
    (existing || []).map(r => `${r.name}||${r.business}`)
  );

  const toInsert = targets
    .map(mapTarget)
    .filter(r => !existingKeys.has(`${r.name}||${r.business}`));

  console.log(`   ${existingKeys.size} already in Supabase — inserting ${toInsert.length} new`);

  if (toInsert.length === 0) {
    console.log('\n✅ Nothing to insert — all leads already exist in Supabase.');
    await printSummary();
    return;
  }

  // ── 3. Insert in batches of 20 ─────────────────────────────────────────
  const BATCH = 20;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    const { error } = await sb.from('gtm_targets').insert(batch);
    if (error) {
      console.error(`\n❌ Insert error (batch ${i / BATCH + 1}):`, error.message);
      console.error('Hint: run gtm-schema.sql in Supabase SQL Editor first to create the table.');
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`   Inserted ${inserted}/${toInsert.length}...\r`);
  }

  console.log(`\n✅ Restored ${inserted} leads to gtm_targets\n`);
  await printSummary();
}

async function printSummary() {
  const { data, count } = await sb
    .from('gtm_targets')
    .select('status', { count: 'exact' });

  const byStatus = (data || []).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`── Supabase gtm_targets summary ──────────────────`);
  console.log(`   Total: ${count}`);
  Object.entries(byStatus).sort((a,b) => b[1]-a[1]).forEach(([s, n]) => {
    console.log(`   ${s.padEnd(20)} ${n}`);
  });
  console.log(`──────────────────────────────────────────────────\n`);
}

restoreLeads().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
