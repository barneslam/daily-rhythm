const https = require('https');
require('dotenv').config();

// Test different payload formats to find the right one
const testPayloads = [
  {
    name: "Flat structure (v1)",
    payload: {
      accountId: "61589010212907",
      platform: "facebook",
      text: "Test post from RIN"
    }
  },
  {
    name: "With post wrapper (v2)",
    payload: {
      post: {
        accountId: "61589010212907",
        platform: "facebook",
        text: "Test post from RIN"
      }
    }
  },
  {
    name: "Blotato format (v3)",
    payload: {
      accountId: "61589010212907",
      platform: "facebook",
      text: "Test post from RIN",
      mediaUrls: []
    }
  }
];

function callBlotato(payload) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(payload);
    const headers = {
      'blotato-api-key': process.env.BLOTATO_API_KEY,
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
  console.log('Testing Blotato API payload formats...\n');
  
  for (const test of testPayloads) {
    try {
      const result = await callBlotato(test.payload);
      console.log(`${test.name}: ${result.statusCode}`);
      if (result.statusCode !== 201 && result.statusCode !== 200) {
        console.log(`  Error: ${JSON.stringify(result.data).substring(0, 150)}`);
      } else {
        console.log(`  ✅ Success!`);
      }
    } catch (err) {
      console.log(`${test.name}: ERROR - ${err.message}`);
    }
    console.log();
  }
}

test().catch(console.error);
