require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const BLOTATO_URL = 'https://backend.blotato.com/v2/posts';

const channelMap = {
  the_strategy_pitch: { linkedinPageId: '103704197' },
  barneslam_co: { linkedinPageId: null },
  axis_chamber: { linkedinPageId: '112398033' },
};
const LINKEDIN_ACCOUNT_ID = '17347';
const INSTAGRAM_ACCOUNT_ID = '40098';

async function blotatoPost(apiKey, payload) {
  const res = await fetch(BLOTATO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'blotato-api-key': apiKey },
    body: JSON.stringify({ post: payload }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Blotato ${res.status}: ${err}`);
  }
  return res.json();
}

async function publishMissedPosts() {
  console.log('📤 Publishing missed posts to Blotato...\n');
  
  const apiKey = process.env.BLOTATO_API_KEY;
  if (!apiKey) {
    console.log('❌ BLOTATO_API_KEY not set');
    return;
  }

  // Get approved drafts from past 3 days
  const today = new Date();
  const threeAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const startDate = threeAgo.toISOString().split('T')[0];

  const { data: drafts } = await supabase
    .from('gtm_drafts')
    .select('*')
    .eq('status', 'approved')
    .gte('draft_date', startDate)
    .lte('draft_date', today.toISOString().split('T')[0])
    .order('draft_date');

  if (!drafts || drafts.length === 0) {
    console.log('No approved drafts found');
    return;
  }

  console.log(`Found ${drafts.length} approved drafts to publish\n`);

  let published = 0;
  for (const draft of drafts) {
    try {
      const scheduledTime = `${draft.draft_date}T14:00:00Z`;
      const channel = channelMap[draft.channel] || {};

      const linkedinTarget = { targetType: 'linkedin' };
      if (channel.linkedinPageId) linkedinTarget.pageId = channel.linkedinPageId;

      // LinkedIn post
      await blotatoPost(apiKey, {
        accountId: LINKEDIN_ACCOUNT_ID,
        target: linkedinTarget,
        content: { text: draft.content, platform: 'linkedin', mediaUrls: [] },
        scheduledTime,
      });

      // Instagram post
      await blotatoPost(apiKey, {
        accountId: INSTAGRAM_ACCOUNT_ID,
        target: { targetType: 'instagram' },
        content: { text: draft.content, platform: 'instagram', mediaUrls: [] },
        scheduledTime,
      });

      console.log(`✓ ${draft.draft_date}: "${draft.title}"`);
      published++;
    } catch (err) {
      console.log(`❌ ${draft.draft_date}: ${err.message}`);
    }
  }

  console.log(`\n✅ Published ${published} posts to Blotato`);
}

publishMissedPosts().catch(console.error);
