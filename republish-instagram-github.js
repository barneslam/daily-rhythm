const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const BLOTATO_API_KEY = 'blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=';
const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';
const INSTAGRAM_ACCOUNT_ID = '40098';
const GITHUB_RAW = 'https://raw.githubusercontent.com/barneslam/daily-rhythm/main/graphics/png';
const DATES = ['2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'];

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
  console.log('📱 Republishing Instagram posts with public GitHub image URLs...\n');

  const draftsDir = path.join(__dirname, 'drafts');

  for (const date of DATES) {
    const draftFile = path.join(draftsDir, `carousel-${date}.md`);
    const graphicUrl = `${GITHUB_RAW}/barneslam_co-${date}.png`;

    try {
      const draftContent = fs.readFileSync(draftFile, 'utf-8');
      const { body } = parseFrontmatter(draftContent);
      const title = body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '') || date;
      const cleanedBody = cleanMarkdown(body);

      console.log(`Publishing: ${title}`);
      console.log(`  Image: ${graphicUrl}`);

      await blotatoPost({
        accountId: INSTAGRAM_ACCOUNT_ID,
        target: { targetType: 'instagram' },
        content: {
          text: cleanedBody,
          platform: 'instagram',
          mediaUrls: [graphicUrl]
        },
        scheduledTime: `${date}T14:00:00Z`
      });

      console.log(`✅ Scheduled\n`);
    } catch (err) {
      console.error(`❌ Failed for ${date}: ${err.message}\n`);
    }
  }

  console.log('✅ Done!');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
