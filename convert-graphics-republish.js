const puppeteer = require('puppeteer');
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

async function convertHtmlToPng(htmlFile, outputFile) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Set viewport to match carousel dimensions
  await page.setViewport({ width: 1080, height: 1350 });

  // Load the HTML file
  await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle0' });

  // Screenshot the page
  await page.screenshot({ path: outputFile, type: 'png' });

  await browser.close();
  console.log(`✓ Converted: ${path.basename(htmlFile)} → ${path.basename(outputFile)}`);
}

async function uploadImageToBlotato(imagePath) {
  // For now, we'll encode the image as base64 and send it
  // In production, you'd want to use a proper image hosting service
  const imageData = fs.readFileSync(imagePath);
  const base64 = imageData.toString('base64');

  // Return data URI for testing
  return `data:image/png;base64,${base64.substring(0, 100)}...`;
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

async function republishInstagramWithGraphics() {
  console.log('🖼️  Converting HTML graphics to PNG and republishing Instagram posts...\n');

  const graphicsDir = path.join(__dirname, 'graphics');
  const pngDir = path.join(__dirname, 'graphics', 'png');

  // Create PNG directory if it doesn't exist
  if (!fs.existsSync(pngDir)) {
    fs.mkdirSync(pngDir, { recursive: true });
  }

  const draftsDir = path.join(__dirname, 'drafts');
  const results = [];

  for (const date of DATES) {
    const htmlFile = path.join(graphicsDir, `barneslam_co-${date}.html`);
    const pngFile = path.join(pngDir, `barneslam_co-${date}.png`);
    const draftFile = path.join(draftsDir, `carousel-${date}.md`);

    if (!fs.existsSync(htmlFile)) {
      console.log(`⏭️  ${htmlFile} not found`);
      continue;
    }

    if (!fs.existsSync(draftFile)) {
      console.log(`⏭️  ${draftFile} not found`);
      continue;
    }

    try {
      // Convert HTML to PNG
      console.log(`📸 Converting ${date}...`);
      await convertHtmlToPng(htmlFile, pngFile);

      // Read the draft content
      const draftContent = fs.readFileSync(draftFile, 'utf-8');
      const { meta, body } = parseFrontmatter(draftContent);

      if (meta.status !== 'approved') {
        console.log(`⏭️  ${date} status=${meta.status}, skipping`);
        continue;
      }

      const title = body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '') || '';
      const cleanedBody = cleanMarkdown(body);
      const scheduledTime = `${date}T14:00:00Z`;

      // Publish to Instagram with image
      try {
        await blotatoPost({
          accountId: INSTAGRAM_ACCOUNT_ID,
          target: { targetType: 'instagram' },
          content: {
            text: cleanedBody,
            platform: 'instagram',
            mediaUrls: [`file://${pngFile}`]  // Local file path
          },
          scheduledTime
        });
        console.log(`✅ Instagram: ${title} (with graphic)`);
        results.push({ date, status: 'published' });
      } catch (err) {
        console.error(`❌ Instagram failed: ${err.message}`);
        results.push({ date, status: 'failed', error: err.message });
      }
    } catch (err) {
      console.error(`❌ Error processing ${date}:`, err.message);
      results.push({ date, status: 'failed', error: err.message });
    }
  }

  console.log('\n✅ Done! Summary:');
  results.forEach(r => {
    console.log(`  ${r.date}: ${r.status}`);
  });
}

republishInstagramWithGraphics().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
