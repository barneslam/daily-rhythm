#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

function extractImageFromCarouselFile(brand, date) {
  const draftDir = path.join(__dirname, 'drafts', brand);
  if (!fs.existsSync(draftDir)) return null;

  const files = fs.readdirSync(draftDir).filter(f => f.includes(date) && f.endsWith('.md'));
  if (files.length === 0) return null;

  const filePath = path.join(draftDir, files[0]);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract image URL from frontmatter
  const match = content.match(/image:\s*(.+)$/m);
  return match ? match[1].trim() : null;
}

// Load brand config dynamically
function loadBrandConfig(brand) {
  const configFile = path.join(__dirname, `config-${brand.toLowerCase()}.json`);
  if (!fs.existsSync(configFile)) {
    throw new Error(`Config not found: ${configFile}`);
  }
  const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

  // Resolve environment variable references (e.g., $SUPABASE_URL_RIN)
  config.supabase.url = config.supabase.url.replace(/\$([A-Z_]+)/g, (match, varName) => {
    return process.env[varName] || match;
  });
  config.supabase.key = config.supabase.key.replace(/\$([A-Z_]+)/g, (match, varName) => {
    return process.env[varName] || match;
  });

  return config;
}

function callBlotato(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const headers = {
      'blotato-api-key': process.env.BLOTATO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
    };

    const options = {
      hostname: 'backend.blotato.com',
      path: path,
      method: method,
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function publishDrafts(brand, date) {
  const config = loadBrandConfig(brand);
  const supabase = createClient(config.supabase.url, config.supabase.key);
  const channels = (config.publishing?.channels || ['facebook', 'instagram']).join(',');

  console.log(`\n📤 Publishing ${brand} drafts to Blotato...\n`);
  console.log(`   Brand: ${brand}`);
  console.log(`   Date: ${date}`);
  console.log(`   Channels: ${channels}\n`);

  // Query gtm_drafts for this date
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

    // Extract image URL from carousel file
    const imageUrl = extractImageFromCarouselFile(brand, draft.draft_date);
    const mediaUrls = imageUrl ? [imageUrl] : [];

    console.log(`📝 Publishing: "${draft.title}"`);
    if (imageUrl) {
      console.log(`   📸 Image: ${imageUrl.substring(0, 50)}...`);
    }

    // Publish to each channel
    for (const channel of channels) {
      const accountConfig = config.accounts[channel];
      if (!accountConfig || !accountConfig.enabled) {
        console.log(`   ⚠️  ${channel} not configured`);
        continue;
      }


      const target = { targetType: channel };
      // Both Instagram and Facebook need pageId in target
      if (channel === 'instagram') {
        target.pageId = accountConfig.account_id;
      } else if (channel === 'facebook') {
        target.pageId = accountConfig.page_id || accountConfig.account_id;
      }

      const payload = {
        post: {
          accountId: accountConfig.account_id,
          content: {
            text: content,
            mediaUrls: mediaUrls,
            platform: channel
          },
          target
        }
      };

      try {
        console.log(`   📡 Sending to ${channel}...`);
        console.log(`      Payload: ${JSON.stringify(payload).substring(0, 200)}...`);
        const result = await callBlotato('POST', '/v2/posts', payload);
        console.log(`      Response: ${result.statusCode} — ${JSON.stringify(result.data).substring(0, 150)}`);
        if (result.statusCode === 200 || result.statusCode === 201) {
          console.log(`   ✅ ${channel}: posted`);
          published++;
        } else {
          console.log(`   ❌ ${channel}: ${result.statusCode}`);
          failed.push(`${draft.title}/${channel}`);
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
