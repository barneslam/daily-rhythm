#!/usr/bin/env node
/**
 * Renders all graphics/*.html SVGs to PNG and uploads to Supabase Storage.
 * Run: node scripts/render-graphics.js
 * Requires: npm install @resvg/resvg-js @supabase/supabase-js dotenv
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
const BUCKET = 'graphics';
const GRAPHICS_DIR = path.join(__dirname, '..', 'graphics');

// Only process dated channel graphics (skip template files)
const DATED_PATTERN = /^(the_strategy_pitch|barneslam_co|axis_chamber)-\d{4}-\d{2}-\d{2}\.html$/;

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (error) throw new Error(`Failed to create bucket: ${error.message}`);
    console.log('✓ Created public bucket: graphics');
  }
}

async function renderAndUpload(htmlFile) {
  const html = fs.readFileSync(path.join(GRAPHICS_DIR, htmlFile), 'utf-8');
  const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/);
  if (!svgMatch) {
    console.warn(`  ⚠ No SVG found in ${htmlFile}, skipping`);
    return null;
  }

  const resvg = new Resvg(svgMatch[0], { fitTo: { mode: 'width', value: 1200 } });
  const png = resvg.render().asPng();

  const pngName = htmlFile.replace('.html', '.png');
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(pngName, png, { contentType: 'image/png', upsert: true });

  if (error) throw new Error(`Upload failed for ${pngName}: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(pngName);
  return publicUrl;
}

async function main() {
  console.log('🎨 Rendering graphics and uploading to Supabase Storage...\n');

  await ensureBucket();

  const files = fs.readdirSync(GRAPHICS_DIR).filter(f => DATED_PATTERN.test(f));
  console.log(`Found ${files.length} dated graphic(s)\n`);

  for (const file of files) {
    process.stdout.write(`  Rendering ${file}... `);
    try {
      const url = await renderAndUpload(file);
      console.log(`✓\n    ${url}`);
    } catch (err) {
      console.log(`✗ ${err.message}`);
    }
  }

  console.log('\n✅ Done. Use these URLs in mediaUrls when publishing.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
