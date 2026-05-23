const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// New API key provided by user
const BLOTATO_API_KEY = 'blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=';
const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';

// Account IDs for barneslam_co channel
const LINKEDIN_ACCOUNT_ID = '17347';
const INSTAGRAM_ACCOUNT_ID = '40098';

// Dates to publish (May 5-8, the missed posts)
const DATES_TO_PUBLISH = [
  '2026-05-05',
  '2026-05-06',
  '2026-05-07',
  '2026-05-08'
];

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const [, frontmatter, body] = match;
  const meta = {};

  frontmatter.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      meta[key] = value;
    }
  });

  return { meta, body: body.trim() };
}

function cleanMarkdown(text) {
  return text
    .replace(/^# .+\n?/m, '')                   // Remove H1 title
    .replace(/^## Slide \d+:\s*/mg, '')        // Strip slide labels
    .replace(/^## /mg, '')                      // Strip remaining H2
    .replace(/\*\*(.+?)\*\*/g, '$1')           // Bold → plain
    .replace(/\*(.+?)\*/g, '$1')               // Italic → plain
    .replace(/^---$/mg, '')                     // Remove dividers
    .replace(/\n{3,}/g, '\n\n')                // Collapse blank lines
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

async function publishMissedCarousels() {
  console.log('🚀 Publishing missed carousel posts from May 5-8...\n');

  const draftsDir = path.join(__dirname, 'drafts');
  const results = [];

  for (const date of DATES_TO_PUBLISH) {
    const filename = `carousel-${date}.md`;
    const filePath = path.join(draftsDir, filename);

    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  ${filename} not found, skipping`);
      results.push({ date, status: 'skipped', reason: 'file not found' });
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { meta, body } = parseFrontmatter(content);

      // Skip if not approved
      if (meta.status !== 'approved') {
        console.log(`⏭️  ${filename} status=${meta.status}, skipping`);
        results.push({ date, status: 'skipped', reason: `status=${meta.status}` });
        continue;
      }

      const title = body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '') || '';
      const cleanedBody = cleanMarkdown(body);

      const scheduledTime = `${date}T14:00:00Z`;

      // Publish to LinkedIn
      try {
        await blotatoPost({
          accountId: LINKEDIN_ACCOUNT_ID,
          target: { targetType: 'linkedin', pageId: '103704197' },
          content: { text: cleanedBody, platform: 'linkedin', mediaUrls: [] },
          scheduledTime
        });
        console.log(`✅ LinkedIn: ${title}`);
      } catch (err) {
        console.error(`❌ LinkedIn failed: ${err.message}`);
      }

      // Publish to Instagram
      try {
        await blotatoPost({
          accountId: INSTAGRAM_ACCOUNT_ID,
          target: { targetType: 'instagram' },
          content: { text: cleanedBody, platform: 'instagram', mediaUrls: [] },
          scheduledTime
        });
        console.log(`✅ Instagram: ${title}`);
      } catch (err) {
        console.error(`❌ Instagram failed: ${err.message}`);
      }

      results.push({ date, title, status: 'published' });
    } catch (err) {
      console.error(`❌ Error processing ${filename}:`, err.message);
      results.push({ date, status: 'failed', error: err.message });
    }
  }

  console.log('\n✅ Done! Summary:');
  results.forEach(r => {
    if (r.status === 'published') {
      console.log(`  ${r.date}: ${r.title}`);
    } else {
      console.log(`  ${r.date}: ${r.status} (${r.reason || r.error})`);
    }
  });
}

publishMissedCarousels().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
