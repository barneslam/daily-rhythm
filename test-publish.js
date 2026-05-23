require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';

async function testPublish() {
  console.log('🔍 Testing publish-scheduler logic...\n');
  
  const today = new Date().toISOString().split('T')[0];
  console.log(`Today's date: ${today}`);
  
  // Query for drafts
  const { data: drafts, error } = await supabase
    .from('gtm_drafts')
    .select('*')
    .eq('draft_date', today)
    .eq('status', 'approved');

  if (error) {
    console.log(`❌ Supabase query failed: ${error.message}`);
    return;
  }

  console.log(`\n✓ Found ${drafts?.length || 0} approved drafts for ${today}`);
  
  if (drafts && drafts.length > 0) {
    drafts.forEach(d => console.log(`  - "${d.title}"`));
  }

  // Check if BLOTATO_API_KEY is set
  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) {
    console.log('\n⚠️  WARNING: BLOTATO_API_KEY is not set!');
    console.log('   This is why publishing is failing.');
    return;
  }

  console.log('\n✓ BLOTATO_API_KEY is configured');
  
  if (drafts && drafts.length > 0) {
    console.log('\n📤 Would publish these drafts to Blotato');
    // Don't actually publish, just show what would happen
  }
}

testPublish().catch(console.error);
