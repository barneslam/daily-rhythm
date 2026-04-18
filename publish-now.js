#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
  console.log('📤 Publishing approved drafts to Blotato...\n');

  const { data: drafts, error } = await supabase
    .from('content_drafts')
    .select('*')
    .eq('status', 'approved');

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  if (!drafts || drafts.length === 0) {
    console.log('❌ No approved drafts found');
    return;
  }

  console.log(`Found ${drafts.length} approved drafts\n`);

  let published = 0;

  for (const draft of drafts) {
    const scheduledTime = draft.scheduled_for || new Date(Date.now() + 24 * 3600000).toISOString();

    const liPayload = {
      post: {
        accountId: '17347',
        content: { text: draft.linkedin_draft, mediaUrls: [], platform: 'linkedin' },
        target: { targetType: 'linkedin' }
      },
      scheduledTime
    };

    const igPayload = {
      post: {
        accountId: '40098',
        content: { text: draft.instagram_draft, mediaUrls: [], platform: 'instagram' },
        target: { targetType: 'instagram' }
      },
      scheduledTime
    };

    try {
      const liResult = await callBlotato('POST', '/v2/posts', liPayload);
      const igResult = await callBlotato('POST', '/v2/posts', igPayload);

      if (liResult.statusCode === 201 && igResult.statusCode === 201) {
        await supabase
          .from('content_drafts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', draft.id);

        published++;
        console.log(`✓ ${draft.business}`);
      } else {
        console.log(`✗ ${draft.business} - LI: ${liResult.statusCode}, IG: ${igResult.statusCode}`);
      }
    } catch (e) {
      console.log(`✗ ${draft.business} - ${e.message}`);
    }
  }

  console.log(`\n✅ Published: ${published}/${drafts.length}`);
}

publishAll().catch(console.error);
