require('dotenv').config();
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const BLOTATO_API_KEY = 'blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=';
const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';
const INSTAGRAM_ACCOUNT_ID = '40098';
const DATES = ['2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const [, frontmatter, body] = match;
  const meta = {};
  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      meta[line.substring(0, colonIndex).trim()] = line.substring(colonIndex + 1).trim();
    }
  });
  return { meta, body: body.trim() };
}

function cleanMarkdown(text) {
  return text
    .replace(/^# .+\n?/m, '')
    .replace(/^## Slide \d+:\s*/mg, '')
    .replace(/^## /mg, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^---$/mg, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function uploadPngToSupabase(pngPath, date) {
  const fileBuffer = fs.readFileSync(pngPath);
  const filename = `barneslam_co-${date}.png`;

  const { data, error } = await supabase.storage
    .from('graphics')
    .upload(filename, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('graphics')
    .getPublicUrl(filename);

  return publicUrl;
}

async function blotatoPost(payload) {
  const res = await fetch(BLOTATO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'blotato-api-key': BLOTATO_API_KEY
    },
    body: JSON.stringify({ post: payload })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Blotato ${res.status}: ${err}`);
  }

  return res.json();
}

async function main() {
  console.log('🚀 Uploading graphics to Supabase and republishing to Instagram...\n');

  if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL not found. Make sure .env is present.');
    process.exit(1);
  }

  const pngDir = path.join(__dirname, 'graphics', 'png');
  const draftsDir = path.join(__dirname, 'drafts');

  for (const date of DATES) {
    const pngFile = path.join(pngDir, `barneslam_co-${date}.png`);
    const draftFile = path.join(draftsDir, `carousel-${date}.md`);

    if (!fs.existsSync(pngFile)) {
      console.log(`⏭️  PNG not found for ${date} — run generate-and-republish.js first`);
      continue;
    }

    try {
      // Upload to Supabase Storage
      console.log(`☁️  Uploading graphic for ${date}...`);
      const publicUrl = await uploadPngToSupabase(pngFile, date);
      console.log(`✓ Public URL: ${publicUrl}`);

      // Read draft content
      const draftContent = fs.readFileSync(draftFile, 'utf-8');
      const { meta, body } = parseFrontmatter(draftContent);
      const title = body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '') || '';
      const cleanedBody = cleanMarkdown(body);

      // Republish to Instagram with real public URL
      await blotatoPost({
        accountId: INSTAGRAM_ACCOUNT_ID,
        target: { targetType: 'instagram' },
        content: {
          text: cleanedBody,
          platform: 'instagram',
          mediaUrls: [publicUrl]
        },
        scheduledTime: `${date}T14:00:00Z`
      });

      console.log(`✅ Instagram scheduled: ${title}\n`);
    } catch (err) {
      console.error(`❌ Failed for ${date}: ${err.message}\n`);
    }
  }

  console.log('✅ Done!');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
