const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('content_drafts')
    .insert({
      business: 'Test Company',
      trigger: 'Test Signal',
      signal: 'Test Signal',
      linkedin_draft: 'Test LinkedIn',
      instagram_draft: 'Test Instagram',
      status: 'pending',
      created_at: new Date().toISOString(),
      scheduled_for: new Date(Date.now() + 24 * 3600000).toISOString()
    })
    .select('id')
    .single();

  console.log('Error:', error?.message);
  console.log('Data:', data);
}

test();
