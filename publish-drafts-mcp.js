#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Load brand config dynamically
function loadBrandConfig(brand) {
  const configFile = path.join(__dirname, `config-${brand.toLowerCase()}.json`);
  if (!fs.existsSync(configFile)) {
    throw new Error(`Config not found: ${configFile}`);
  }
  return JSON.parse(fs.readFileSync(configFile, 'utf8'));
}

async function publishDrafts(brand, date) {
  const config = loadBrandConfig(brand);

  console.log(`\n📤 Publishing ${brand} drafts to Blotato...\n`);
  console.log(`   Brand: ${brand}`);
  console.log(`   Date: ${date}\n`);

  // Query gtm_drafts for this brand/date
  const { data: drafts, error } = await supabase
    .from('gtm_drafts')
    .select('*')
    .eq('draft_date', date);

  if (error) {
    console.error('❌ Query error:', error.message);
    return;
  }

  if (!drafts || drafts.length === 0) {
    console.log('❌ No approved drafts found for this date');
    return;
  }

  console.log(`Found ${drafts.length} draft(s)\n`);

  let published = 0;
  const failed = [];

  for (const draft of drafts) {
    const status = draft.status;
    if (status !== 'approved') {
      console.log(`⏭️  Skipping "${draft.title}" (status: ${status})`);
      continue;
    }

    const channels = draft.channel.split(',').map(c => c.trim());
    const content = draft.content;

    console.log(`📝 Publishing: "${draft.title}"`);

    // Publish to each channel
    for (const channel of channels) {
      const accountConfig = config.accounts[channel];
      if (!accountConfig || !accountConfig.enabled) {
        console.log(`   ⚠️  ${channel} not configured`);
        continue;
      }

      try {
        // For Facebook
        if (channel === 'facebook') {
          const pageId = accountConfig.page_id;
          console.log(`   📤 facebook (page: ${pageId})...`);
          // In production, would call: mcp__blotato__blotato_create_post with Facebook params
          console.log(`   ✅ facebook: posted (mock)`);
          published++;
        }
        // For Instagram
        else if (channel === 'instagram') {
          const handle = accountConfig.handle;
          console.log(`   📤 instagram (${handle})...`);
          // In production, would call: mcp__blotato__blotato_create_post with Instagram params
          console.log(`   ✅ instagram: posted (mock)`);
          published++;
        }
      } catch (err) {
        console.log(`   ❌ ${channel}: ${err.message}`);
        failed.push(`${draft.title}/${channel}`);
      }
    }
  }

  console.log(`\n✅ Publishing complete: ${published} published`);
  if (failed.length > 0) {
    console.log(`⚠️  Failed: ${failed.join(', ')}`);
  }
}

// Parse CLI args
const brand = process.argv[2] || 'barnes';
const date = process.argv[3] || new Date().toISOString().split('T')[0];

publishDrafts(brand, date).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
