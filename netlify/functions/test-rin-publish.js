const { createClient } = require('@supabase/supabase-js');
const https = require('https');

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

exports.handler = async (event) => {
  try {
    const { brand = 'RIN', date = new Date().toISOString().split('T')[0] } = event.queryStringParameters || {};

    console.log(`Testing RIN publish: brand=${brand}, date=${date}`);

    // Schedule 1 minute from now (Blotato requires future time)
    const futureTime = new Date(Date.now() + 60000).toISOString();

    // Test payload for Facebook
    const facebookPayload = {
      post: {
        accountId: '30386',
        content: {
          text: 'Test post from RIN Daily Rhythm system — Facebook',
          mediaUrls: [],
          platform: 'facebook'
        },
        target: {
          targetType: 'facebook',
          pageId: '30386'
        }
      },
      scheduledTime: futureTime
    };

    console.log('\n📤 Test 1: Facebook with pageId in target');
    console.log('Payload:', JSON.stringify(facebookPayload, null, 2));

    const fbResult = await callBlotato('POST', '/v2/posts', facebookPayload);
    console.log(`Response: ${fbResult.statusCode}`, JSON.stringify(fbResult.data, null, 2));

    // Test payload for Instagram
    const igPayload = {
      post: {
        accountId: '45365',
        content: {
          text: 'Test post from RIN Daily Rhythm system — Instagram',
          mediaUrls: [],
          platform: 'instagram'
        },
        target: {
          targetType: 'instagram',
          pageId: '45365'
        }
      },
      scheduledTime: futureTime
    };

    console.log('\n📤 Test 2: Instagram');
    console.log('Payload:', JSON.stringify(igPayload, null, 2));

    const igResult = await callBlotato('POST', '/v2/posts', igPayload);
    console.log(`Response: ${igResult.statusCode}`, JSON.stringify(igResult.data, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'RIN publish test complete',
        facebook: {
          statusCode: fbResult.statusCode,
          success: fbResult.statusCode >= 200 && fbResult.statusCode < 300,
          response: fbResult.data
        },
        instagram: {
          statusCode: igResult.statusCode,
          success: igResult.statusCode >= 200 && igResult.statusCode < 300,
          response: igResult.data
        }
      })
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
