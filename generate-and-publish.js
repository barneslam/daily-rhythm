const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function callBlotato(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const headers = {
      'blotato-api-key': process.env.BLOTATO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
    };

    const options = {
      hostname: 'backend.blotato.com',
      path: path,
      method: method,
      headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

async function run() {
  console.log('🚀 Full GTM Pipeline: Generate → Approve → Publish\n');

  // Step 1: Get leads
  const { data: leads } = await supabase
    .from('gtm_targets')
    .select('id, name, business, signal')
    .limit(20);

  if (!leads || leads.length === 0) {
    console.log('❌ No leads found');
    return;
  }

  console.log(`📝 Step 1: Generating content for ${leads.length} leads...`);
  
  let createdCount = 0;
  const draftIds = [];

  for (const lead of leads) {
    const liText = `🚀 ${lead.name} at ${lead.business.split(',')[0]} - ${lead.signal}. Expert on GTM scaling. Open to strategic conversations.`;
    const igText = `Meet ${lead.name}: ${lead.signal}. Leading GTM at scale.`;

    const { data: draft, error } = await supabase
      .from('content_drafts')
      .insert({
        business: lead.business,
        trigger: lead.signal,
        signal: lead.signal,
        linkedin_draft: liText,
        instagram_draft: igText,
        status: 'pending',
        created_at: new Date().toISOString(),
        scheduled_for: new Date(Date.now() + 24 * 3600000).toISOString()
      })
      .select('id')
      .single();

    if (!error && draft) {
      createdCount++;
      draftIds.push(draft.id);
    }
  }

  console.log(`✓ Created ${createdCount} drafts\n`);

  // Step 2: Approve
  console.log(`✅ Step 2: Auto-approving ${draftIds.length} drafts...`);
  
  for (const id of draftIds) {
    await supabase
      .from('content_drafts')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  console.log(`✓ Approved ${draftIds.length} drafts\n`);

  // Step 3: Fetch and publish
  console.log(`🚀 Step 3: Publishing to Blotato...`);
  
  const { data: approved } = await supabase
    .from('content_drafts')
    .select('*')
    .in('id', draftIds)
    .eq('status', 'approved');

  let published = 0;

  for (const draft of approved) {
    const liResult = await callBlotato('POST', '/v2/posts', {
      post: {
        accountId: '17347',
        content: { text: draft.linkedin_draft, mediaUrls: [], platform: 'linkedin' },
        target: { targetType: 'linkedin' }
      },
      scheduledTime: draft.scheduled_for
    });

    const igResult = await callBlotato('POST', '/v2/posts', {
      post: {
        accountId: '40098',
        content: { text: draft.instagram_draft, mediaUrls: [], platform: 'instagram' },
        target: { targetType: 'instagram' }
      },
      scheduledTime: draft.scheduled_for
    });

    if (liResult.statusCode === 201 && igResult.statusCode === 201) {
      await supabase
        .from('content_drafts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_to: 'linkedin,instagram',
          blotato_post_id: liResult.data.postSubmissionId
        })
        .eq('id', draft.id);

      published++;
      console.log(`✓ ${draft.business}`);
    }
  }

  console.log(`\n✅ Pipeline complete: ${published} posts published`);
}

run().catch(console.error);
