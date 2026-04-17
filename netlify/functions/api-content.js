const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const contentDir = path.join(__dirname, '../..', 'content');
    let contentFiles = [];

    if (fs.existsSync(contentDir)) {
      const files = fs.readdirSync(contentDir);
      contentFiles = files
        .filter(f => f.startsWith(dateStr) && f.endsWith('.md'))
        .map(filename => {
          const filepath = path.join(contentDir, filename);
          try {
            const content = fs.readFileSync(filepath, 'utf8');
            return {
              filename: filename,
              title: filename.replace(dateStr + '-', '').replace('.md', '').replace(/-/g, ' ').toUpperCase(),
              content: content,
              status: 'draft',
              created_at: new Date(fs.statSync(filepath).mtime).toISOString()
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: contentFiles,
        date: dateStr,
        count: contentFiles.length
      })
    };
  } catch (e) {
    console.error('Content API error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [], error: e.message })
    };
  }
};
