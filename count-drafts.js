const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function check() {
  const { data, count, error } = await supabase
    .from('content_drafts')
    .select('id, status', { count: 'exact' });
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }

  const approved = data.filter(d => d.status === 'approved').length;
  const pending = data.filter(d => d.status === 'pending').length;
  
  console.log(`Total: ${count}`);
  console.log(`  Approved: ${approved}`);
  console.log(`  Pending: ${pending}`);
}

check();
