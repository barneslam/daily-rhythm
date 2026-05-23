const https = require('https');
require('dotenv').config();

const testPayloads = [
  {
    name: "With content + target",
    payload: {
      post: {
        accountId: "61589010212907",
        content: {
          text: "Test post from RIN",
          mediaUrls: [],
          platform: "facebook"
        },
        target: {
          targetType: "facebook"
        }
      },
      scheduledTime: new Date().toISOString()
    }
  },
  {
    name: "Without scheduledTime",
    payload: {
      post: {
        accountId: "61589010212907",
        content: {
          text: "Test post from RIN",
          mediaUrls: [],
          platform: "facebook"
        },
        target: {
          targetType: "facebook"
        }
      }
    }
  },
  {
    name: "With pageId instead of accountId",
    payload: {
      post: {
        pageId: "61589010212907",
        content: {
          text: "Test post from RIN",
          mediaUrls: [],
          platform: "facebook"
        },
        target: {
          targetType: "facebook"
        }
      }
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
        const err = JSON.stringify(result.data);
        console.log(`  Error: ${err.substring(0, 200)}`);
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
