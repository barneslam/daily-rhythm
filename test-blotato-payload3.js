#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const BLOTATO_API_KEY = process.env.BLOTATO_API_KEY;

if (!BLOTATO_API_KEY) {
  console.error('❌ BLOTATO_API_KEY not set');
  process.exit(1);
}

console.log(`Using API key: ${BLOTATO_API_KEY.substring(0, 10)}...${BLOTATO_API_KEY.substring(BLOTATO_API_KEY.length - 10)}`);

function callBlotato(payload) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(payload);
    const headers = {
      'blotato-api-key': BLOTATO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
    };

    const options = {
      hostname: 'backend.blotato.com',
      path: '/v2/posts',
      method: 'POST',
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

async function test() {
  // Test payload with pageId in target
  const payload = {
    post: {
      accountId: '61589010212907',
      content: {
        text: 'Test post from RIN Daily Rhythm system',
        mediaUrls: [],
        platform: 'facebook'
      },
      target: {
        targetType: 'facebook',
        pageId: '61589010212907'  // Added pageId
      }
    },
    scheduledTime: new Date().toISOString()
  };

  console.log('\n📤 Testing Blotato API payload...\n');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('\n');

  try {
    const result = await callBlotato(payload);
    console.log(`Status: ${result.statusCode}`);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log('\n✅ SUCCESS! Payload format is correct.');
    } else {
      console.log('\n❌ Error. Checking response for hints...');
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message);
  }
}

test();
