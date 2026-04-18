const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function check() {
  const { data: d1, error: e1 } = await supabase
    .from('content_drafts')
    .select('*')
    .limit(1);
  
  if (d1) {
    console.log('✓ content_drafts exists - Count:', d1.length);
  } else {
    console.log('✗ content_drafts:', e1?.message);
  }

  const { data: d2, error: e2 } = await supabase
    .from('gtm_drafts')
    .select('*')
    .limit(1);
  
  if (d2) {
    console.log('✓ gtm_drafts exists - Count:', d2.length);
  } else {
    console.log('✗ gtm_drafts:', e2?.message);
  }
}

check();
