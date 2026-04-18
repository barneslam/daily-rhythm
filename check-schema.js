const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('gtm_drafts')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('Table exists but empty. Checking info...');
    const { data: info } = await supabase
      .rpc('get_table_columns', { table_name: 'gtm_drafts' })
      .catch(() => ({ data: null }));
    console.log('Info:', info);
  }
}

check();
