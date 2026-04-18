#!/usr/bin/env node

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

async function publishAll() {
  console.log('📤 Publishing all approved drafts to Blotato...\n');

  const { data: drafts, error } = await supabase
    .from('content_drafts')
    .select('id, business, linkedin_draft, instagram_draft, scheduled_for')
    .eq('status', 'approved')
    .is('published_at', null);

  if (error || !drafts || drafts.length === 0) {
    console.error('❌ No approved drafts found:', error?.message || 'empty');
    return;
  }

  console.log(`Found ${drafts.length} approved drafts\n`);

  let published = 0;
  const failedIds = [];

  for (const draft of drafts) {
    const scheduledTime = draft.scheduled_for || new Date(Date.now() + 24 * 3600000).toISOString();

    // LinkedIn
    const liPayload = {
      post: {
        accountId: '17347',
        content: {
          text: draft.linkedin_draft,
          mediaUrls: [],
          platform: 'linkedin'
        },
        target: { targetType: 'linkedin' }
      },
      scheduledTime
    };

    const liResult = await callBlotato('POST', '/v2/posts', liPayload);

    // Instagram
    const igPayload = {
      post: {
        accountId: '40098',
        content: {
          text: draft.instagram_draft,
          mediaUrls: [],
          platform: 'instagram'
        },
        target: { targetType: 'instagram' }
      },
      scheduledTime
    };

    const igResult = await callBlotato('POST', '/v2/posts', igPayload);

    if (liResult.statusCode === 201 && igResult.statusCode === 201) {
      await supabase
        .from('gtm_drafts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          published_to: 'linkedin,instagram',
          blotato_post_id: liResult.data.postSubmissionId
        })
        .eq('id', draft.id);

      published++;
      console.log(`✓ ${draft.business} → LinkedIn & Instagram`);
    } else {
      failedIds.push(draft.id);
      console.log(`✗ ${draft.business} → Failed (LI: ${liResult.statusCode}, IG: ${igResult.statusCode})`);
    }
  }

  console.log(`\n📊 Results: ${published}/${drafts.length} published`);
  if (failedIds.length) console.log(`Failed IDs: ${failedIds.join(', ')}`);
}

publishAll().catch(console.error);
