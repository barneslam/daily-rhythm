#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Parse CLI args for brand
const brand = process.argv[2] || 'default';
const DRAFTS_DIR = brand === 'default'
  ? path.join(__dirname, 'drafts')
  : path.join(__dirname, 'drafts', brand);

// Load brand-specific config
function loadBrandConfig(brand) {
  if (brand === 'default') {
    // Use env vars directly for default brand
    return {
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY
      }
    };
  }

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

const config = loadBrandConfig(brand);
const supabase = createClient(config.supabase.url, config.supabase.key);

function stripMarkdown(text) {
  return text
    .replace(/^#+\s+/gm, '')  // Remove headers (##, ###, etc.)
    .replace(/\*\*/g, '')     // Remove bold markers
    .replace(/\*/g, '')       // Remove italic markers
    .replace(/^---$/gm, '')   // Remove horizontal rules
    .trim();
}

async function syncDraftsToSupabase() {
  try {
    if (!fs.existsSync(DRAFTS_DIR)) {
      console.error(`❌ Drafts directory not found: ${DRAFTS_DIR}`);
      process.exit(1);
    }

    const files = fs.readdirSync(DRAFTS_DIR).filter(f => f.startsWith('carousel-') && f.endsWith('.md'));
    
    console.log(`📝 Found ${files.length} carousel drafts to sync...`);

    for (const file of files) {
      const filePath = path.join(DRAFTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse frontmatter
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) {
        console.warn(`⚠️  Skipping ${file} (invalid format)`);
        continue;
      }

      const frontmatter = match[1];
      const body = match[2];
      
      // Extract date from filename (carousel-2026-05-04.md or carousel-rin-2026-05-04.md -> 2026-05-04)
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

      // Extract title from first h1 or h2
      const titleMatch = body.match(/^#+\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Untitled Carousel';

      const draft = {
        draft_date: date,
        draft_type: 'carousel',
        channel: 'instagram,facebook,linkedin',
        title: title,
        content: stripMarkdown(body),
        status: 'approved'
      };

      // Check if draft already exists
      const { data: existing } = await supabase
        .from('gtm_drafts')
        .select('id')
        .eq('draft_date', date)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`⏭️  ${file} already exists, skipping`);
        continue;
      }

      // Insert draft
      const { data, error } = await supabase
        .from('gtm_drafts')
        .insert([draft])
        .select();

      if (error) {
        console.error(`❌ Error syncing ${file}:`, error.message);
      } else {
        console.log(`✅ Synced ${file}`);
      }
    }

    console.log('\n✅ Sync complete!');
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  }
}

syncDraftsToSupabase();
