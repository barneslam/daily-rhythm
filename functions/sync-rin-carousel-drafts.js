const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function stripMarkdown(text) {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^---$/gm, '')
    .trim();
}

exports.handler = async (event, context) => {
  try {
    console.log('🚀 RIN Carousel Sync Started');

    const supabaseUrl = process.env.SUPABASE_URL_RIN;
    const supabaseKey = process.env.SUPABASE_ANON_KEY_RIN;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing RIN Supabase credentials (SUPABASE_URL_RIN, SUPABASE_ANON_KEY_RIN)');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const draftsDir = path.join(process.cwd(), 'drafts', 'rin');

    if (!fs.existsSync(draftsDir)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: `RIN drafts directory not found: ${draftsDir}` })
      };
    }

    const files = fs.readdirSync(draftsDir).filter(f => f.startsWith('carousel-') && f.endsWith('.md'));
    console.log(`📝 Found ${files.length} carousel drafts to sync`);

    let synced = 0;
    let skipped = 0;
    const results = [];

    for (const file of files) {
      const filePath = path.join(draftsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');

      // Parse frontmatter
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) {
        console.warn(`⚠️  Skipping ${file} (invalid format)`);
        skipped++;
        continue;
      }

      const frontmatter = match[1];
      const body = match[2];

      // Extract date from filename
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];

      // Extract title
      const titleMatch = body.match(/^#+\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'RIN Carousel';

      const draft = {
        draft_date: date,
        draft_type: 'carousel',
        channel: 'instagram,facebook',
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
        skipped++;
        results.push({
          file,
          status: 'skipped',
          reason: 'already_exists'
        });
        continue;
      }

      // Insert draft
      const { data, error } = await supabase
        .from('gtm_drafts')
        .insert([draft])
        .select();

      if (error) {
        console.error(`❌ Error syncing ${file}:`, error.message);
        results.push({
          file,
          status: 'failed',
          error: error.message
        });
      } else {
        console.log(`✅ Synced ${file}`);
        synced++;
        results.push({
          file,
          status: 'synced',
          date,
          title
        });
      }
    }

    console.log(`\n✅ Sync complete: ${synced} synced, ${skipped} skipped`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        synced,
        skipped,
        total: files.length,
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
