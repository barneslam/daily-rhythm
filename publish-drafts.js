#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
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
  console.log('📤 Publishing approved drafts to Blotato via REST API...\n');

  const url = `${process.env.SUPABASE_URL}/rest/v1/content_drafts?status=eq.approved&select=id,business,linkedin_draft,instagram_draft,scheduled_for`;

  const drafts = await new Promise((resolve, reject) => {
    const options = {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });

  if (!drafts || drafts.length === 0) {
    console.log('❌ No approved drafts found');
    return;
  }

  console.log(`Found ${drafts.length} approved drafts\n`);

  let published = 0;
  const failedIds = [];

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
        failedIds.push(draft.id);
        console.log(`✗ ${draft.business} - LI: ${liResult.statusCode}, IG: ${igResult.statusCode}`);
      }
    } catch (e) {
      failedIds.push(draft.id);
      console.log(`✗ ${draft.business} - ${e.message}`);
    }
  }

  console.log(`\n📊 Results: ${published}/${drafts.length} published`);
  if (failedIds.length) console.log(`Failed IDs: ${failedIds.join(', ')}`);
}

publishAll().catch(console.error);
