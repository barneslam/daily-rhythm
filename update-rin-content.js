const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://zyoszbmahxnfcokuzkuv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInJlZiI6Inp5b3N6Ym1haHhuZmNva3V6a3V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDU3OTMsImV4cCI6MjA4OTA4MTc5M30.Ilz4RYTcgZU3IMnABg0eV7iAfFcC0iykyl4DOln-mjY'
);

function stripMarkdown(text) {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^---$/gm, '')
    .trim();
}

async function updateRinContent() {
  const drafts = [
    { date: '2026-05-04', file: 'drafts/rin/carousel-rin-2026-05-04.md' },
    { date: '2026-05-11', file: 'drafts/rin/carousel-rin-2026-05-11.md' }
  ];

  for (const item of drafts) {
    const content = fs.readFileSync(item.file, 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;

    const body = match[2];
    const titleMatch = body.match(/^#+\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled';

    const { error } = await supabase.from('gtm_drafts').upsert({
      draft_date: item.date,
      draft_type: 'carousel',
      channel: 'instagram,facebook,linkedin',
      title: title,
      content: stripMarkdown(body),
      status: 'approved'
    }, { onConflict: 'draft_date' });

    if (error) {
      console.error(`Error updating ${item.date}:`, error);
    } else {
      console.log(`✅ Updated ${item.date} with clean content`);
    }
  }
}

updateRinContent();
