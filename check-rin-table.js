const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkTables() {
  // Try querying rin_gtm_drafts
  const { data, error } = await supabase
    .from('rin_gtm_drafts')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ rin_gtm_drafts table not found:', error.message);
    console.log('\n📝 Need to create rin_gtm_drafts table in Supabase');
  } else {
    console.log('✅ rin_gtm_drafts table exists');
    console.log('Current records:', data?.length || 0);
  }
}

checkTables();
