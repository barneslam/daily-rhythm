const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const http = require('http');

const BLOTATO_API_KEY = 'blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=';
const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';
const INSTAGRAM_ACCOUNT_ID = '40098';

const DATES = ['2026-05-05', '2026-05-06', '2026-05-07', '2026-05-08'];
const PNG_SERVER_PORT = 3456;
const PNG_SERVER_URL = `http://localhost:${PNG_SERVER_PORT}`;

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
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.setViewport({ width: 1080, height: 1350 });
  await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputFile, type: 'png', fullPage: false });

  await browser.close();
  console.log(`✓ Generated: ${path.basename(outputFile)}`);
}

async function startPngServer(pngDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405);
        res.end();
        return;
      }

      const filePath = path.join(pngDir, req.url.replace('/png/', ''));

      if (!fs.existsSync(filePath) || !filePath.startsWith(pngDir)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'image/png' });
      fs.createReadStream(filePath).pipe(res);
    });

    server.listen(PNG_SERVER_PORT, () => {
      console.log(`🌐 PNG server running on ${PNG_SERVER_URL}/png\n`);
      resolve(server);
    });
  });
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
  console.log('🎨 Generating carousel graphics and republishing to Instagram...\n');

  const graphicsDir = path.join(__dirname, 'graphics');
  const pngDir = path.join(__dirname, 'graphics', 'png');
  const draftsDir = path.join(__dirname, 'drafts');

  // Create PNG directory
  if (!fs.existsSync(pngDir)) {
    fs.mkdirSync(pngDir, { recursive: true });
  }

  // Step 1: Convert all HTML to PNG
  console.log('📸 Converting HTML to PNG...');
  for (const date of DATES) {
    const htmlFile = path.join(graphicsDir, `barneslam_co-${date}.html`);
    const pngFile = path.join(pngDir, `barneslam_co-${date}.png`);

    if (fs.existsSync(htmlFile)) {
      await convertHtmlToPng(htmlFile, pngFile);
    }
  }

  console.log('\n✓ All graphics generated\n');

  // Step 2: Start PNG server
  const server = await startPngServer(pngDir);

  // Step 3: Republish to Instagram
  console.log('📱 Republishing to Instagram...\n');
  const results = [];

  for (const date of DATES) {
    const pngFile = path.join(pngDir, `barneslam_co-${date}.png`);
    const draftFile = path.join(draftsDir, `carousel-${date}.md`);

    if (!fs.existsSync(pngFile) || !fs.existsSync(draftFile)) {
      console.log(`⏭️  Skipping ${date} - missing files`);
      continue;
    }

    try {
      const draftContent = fs.readFileSync(draftFile, 'utf-8');
      const { meta, body } = parseFrontmatter(draftContent);

      if (meta.status !== 'approved') {
        console.log(`⏭️  ${date} not approved`);
        continue;
      }

      const title = body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '') || '';
      const cleanedBody = cleanMarkdown(body);
      const scheduledTime = `${date}T14:00:00Z`;
      const graphicUrl = `${PNG_SERVER_URL}/png/barneslam_co-${date}.png`;

      console.log(`Publishing: ${title}`);
      console.log(`  Graphic: ${graphicUrl}`);

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

      console.log(`✅ Published\n`);
      results.push({ date, status: 'published' });
    } catch (err) {
      console.error(`❌ Failed: ${err.message}\n`);
      results.push({ date, status: 'failed', error: err.message });
    }
  }

  // Keep server running for a few seconds, then close
  console.log('Waiting for Blotato to process requests...');
  setTimeout(() => {
    server.close();
    console.log('\n✅ Done!');
    process.exit(0);
  }, 5000);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
