require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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
  return text.replace(/^# .+\n?/m, '').replace(/^## Slide \d+:\s*/mg, '').replace(/^## /mg, '').replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/^---$/mg, '').replace(/\n{3,}/g, '\n\n').trim();
}

async function syncDrafts() {
  console.log('📤 Syncing carousel drafts to Supabase...\n');
  
  const draftsDir = path.join(__dirname, 'drafts');
  const files = fs.readdirSync(draftsDir).filter(f => f.match(/^carousel-2026-05-\d{2}\.md$/)).sort();

  console.log(`Found ${files.length} carousel drafts\n`);

  let syncedCount = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(draftsDir, file), 'utf-8');
      const { meta, body } = parseFrontmatter(content);
      
      const draftDate = meta.date || file.match(/carousel-(.+?)\.md/)[1];
      const title = body.split('\n').find(l => l.startsWith('# '))?.replace(/^# /, '') || '';
      const cleanedBody = cleanMarkdown(body);

      const { data: existing } = await supabase.from('gtm_drafts').select('id').eq('draft_date', draftDate).single();

      if (existing) {
        await supabase.from('gtm_drafts').update({
          content: cleanedBody,
          title,
          status: meta.status || 'pending',
          channel: 'barneslam_co',
          draft_type: 'carousel',
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
        console.log(`✓ ${draftDate}: updated`);
      } else {
        await supabase.from('gtm_drafts').insert([{
          draft_date: draftDate,
          status: meta.status || 'pending',
          content: cleanedBody,
          title,
          draft_type: 'carousel',
          channel: 'barneslam_co',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        console.log(`✓ ${draftDate}: created (${meta.status})`);
      }
      syncedCount++;
    } catch (err) {
      console.log(`❌ ${file}: ${err.message}`);
    }
  }
  console.log(`\n✅ Synced ${syncedCount} drafts`);
}

syncDrafts().catch(err => { console.error('Error:', err); process.exit(1); });
