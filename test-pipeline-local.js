#!/usr/bin/env node

const https = require('https');
require('dotenv').config();

const API_KEY = 'blt_KWcdr0Ak1eRPSTWBwPy6LrFeyrbT6pbDx3Y1B2iukys=';

function callBlotato(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const headers = {
      'blotato-api-key': API_KEY,
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

async function testPipeline() {
  console.log('🧪 Testing Blotato API with new key...\n');

  // Test LinkedIn
  console.log('📝 Test 1: Publishing to LinkedIn');
  const liPayload = {
    post: {
      accountId: '17347',
      content: {
        text: '🚀 GTM Pipeline Live Test - April 18 at 1 AM',
        mediaUrls: [],
        platform: 'linkedin'
      },
      target: {
        targetType: 'linkedin'
      }
    },
    scheduledTime: new Date(Date.now() + 24 * 3600000).toISOString()
  };

  const liResult = await callBlotato('POST', '/v2/posts', liPayload);
  console.log(`  Status: ${liResult.statusCode}`);
  console.log(`  Response:`, liResult.data);
  console.log();

  // Test Instagram
  console.log('📝 Test 2: Publishing to Instagram');
  const igPayload = {
    post: {
      accountId: '40098',
      content: {
        text: 'GTM Pipeline Live Test - April 18',
        mediaUrls: [],
        platform: 'instagram'
      },
      target: {
        targetType: 'instagram'
      }
    },
    scheduledTime: new Date(Date.now() + 24 * 3600000).toISOString()
  };

  const igResult = await callBlotato('POST', '/v2/posts', igPayload);
  console.log(`  Status: ${igResult.statusCode}`);
  console.log(`  Response:`, igResult.data);
  console.log();

  if (liResult.statusCode === 201 && igResult.statusCode === 201) {
    console.log('✅ API working! Both posts scheduled successfully.');
    console.log(`   LinkedIn: ${liResult.data.postSubmissionId}`);
    console.log(`   Instagram: ${igResult.data.postSubmissionId}`);
    console.log('\n📋 Next steps:');
    console.log('   1. Update BLOTATO_API_KEY in Netlify environment');
    console.log('   2. Deploy updated functions');
    console.log('   3. Run /api/test-full-pipeline to publish all 41 pending drafts');
  } else {
    console.log('❌ API test failed');
  }
}

testPipeline().catch(console.error);
