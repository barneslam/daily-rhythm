const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const API_KEY = 'blt_WSloRu5STdZRMT2KSiMEJszhs/fatuTVoq3COpCvZH8=';

const channelMap = {
  the_strategy_pitch: { linkedinPageId: '103704197' },
  barneslam_co: { linkedinPageId: null },
  axis_chamber: { linkedinPageId: '112398033' },
};

async function blotatoPost(payload) {
  const res = await fetch('https://backend.blotato.com/v2/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'blotato-api-key': API_KEY },
    body: JSON.stringify({ post: payload }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Blotato ${res.status}: ${err}`);
  }
  return res.json();
}

async function publishMissed() {
  console.log('📤 Publishing missed posts with new API key...\n');
  
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

  console.log(`Found ${drafts.length} approved drafts\n`);

  let published = 0;
  for (const draft of drafts) {
    try {
      const scheduledTime = `${draft.draft_date}T14:00:00Z`;
      const channel = channelMap[draft.channel] || {};
      const linkedinTarget = { targetType: 'linkedin' };
      if (channel.linkedinPageId) linkedinTarget.pageId = channel.linkedinPageId;

      await blotatoPost({
        accountId: '17347',
        target: linkedinTarget,
        content: { text: draft.content, platform: 'linkedin', mediaUrls: [] },
        scheduledTime,
      });

      await blotatoPost({
        accountId: '40098',
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

publishMissed().catch(console.error);
