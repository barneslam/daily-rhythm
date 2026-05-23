const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const BLOTATO_API_KEY = 'blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=';
const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';
const INSTAGRAM_ACCOUNT_ID = '40098';

const DATES = ['2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'];

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
    .replace(/^# .+\n?/m, '')
    .replace(/^## Slide \d+:\s*/mg, '')
    .replace(/^## /mg, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^---$/mg, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function getGraphicUrl(htmlPath) {
  // Read the HTML file
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Use html2image.com API (free tier)
  // This creates a publicly accessible image URL
  try {
    const response = await fetch('https://html2image.com/api/v1/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlContent,
        width: 1080,
        height: 1350,
        format: 'png'
      })
    });

    if (!response.ok) {
      // Fallback: use a data URL approach
      console.warn(`⚠️  html2image API unavailable for ${path.basename(htmlPath)}`);
      return null;
    }

    const data = await response.json();
    return data.url;
  } catch (err) {
    console.warn(`⚠️  Could not generate image URL:`, err.message);
    return null;
  }
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

async function republishInstagram() {
  console.log('📱 Republishing Instagram posts with graphics...\n');

  const graphicsDir = path.join(__dirname, 'graphics');
  const draftsDir = path.join(__dirname, 'drafts');
  const results = [];

  for (const date of DATES) {
    const htmlFile = path.join(graphicsDir, `barneslam_co-${date}.html`);
    const draftFile = path.join(draftsDir, `carousel-${date}.md`);

    if (!fs.existsSync(htmlFile)) {
      console.log(`⏭️  HTML graphic not found for ${date}`);
      continue;
    }

    if (!fs.existsSync(draftFile)) {
      console.log(`⏭️  Draft not found for ${date}`);
      continue;
    }

    try {
      // Read draft
      const draftContent = fs.readFileSync(draftFile, 'utf-8');
      const { meta, body } = parseFrontmatter(draftContent);

      if (meta.status !== 'approved') {
        console.log(`⏭️  ${date} not approved, skipping`);
        continue;
      }

      const title = body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '') || '';
      const cleanedBody = cleanMarkdown(body);
      const scheduledTime = `${date}T14:00:00Z`;

      // Try to get graphic URL
      console.log(`🎨 Converting graphic for ${date}...`);
      const graphicUrl = await getGraphicUrl(htmlFile);

      if (!graphicUrl) {
        console.log(`⚠️  Skipping ${date} - graphic conversion failed`);
        results.push({ date, status: 'skipped', reason: 'graphic conversion failed' });
        continue;
      }

      console.log(`📸 Graphic ready: ${graphicUrl.substring(0, 50)}...`);

      // Publish to Instagram with image
      try {
        await blotatoPost({
          accountId: INSTAGRAM_ACCOUNT_ID,
          target: { targetType: 'instagram' },
          content: {
            text: cleanedBody,
            platform: 'instagram',
            mediaUrls: [graphicUrl]
          },
          scheduledTime
        });
        console.log(`✅ Instagram: ${title}\n`);
        results.push({ date, status: 'published' });
      } catch (err) {
        console.error(`❌ Instagram publish failed: ${err.message}`);
        results.push({ date, status: 'failed', error: err.message });
      }
    } catch (err) {
      console.error(`❌ Error processing ${date}:`, err.message);
      results.push({ date, status: 'failed', error: err.message });
    }
  }

  console.log('\n✅ Republish Summary:');
  results.forEach(r => {
    if (r.status === 'published') {
      console.log(`  ✅ ${r.date}: Published`);
    } else {
      console.log(`  ⏭️  ${r.date}: ${r.status} (${r.reason || r.error})`);
    }
  });
}

republishInstagram().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
