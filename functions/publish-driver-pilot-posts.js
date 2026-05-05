const fs = require('fs');
const path = require('path');
const https = require('https');

function callBlotato(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const headers = {
      'blotato-api-key': process.env.BLOTATO_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyStr, 'utf8')
    };

    const options = {
      hostname: 'backend.blotato.com',
      path: endpoint,
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

function getPostVariant(weekNumber) {
  // Cycle through 4 variants
  const variants = [
    'Post Variant 1: Problem/Solution',
    'Post Variant 2: Benefit-Focused',
    'Post Variant 3: Social Proof',
    'Post Variant 4: Call-to-Action'
  ];
  return variants[weekNumber % 4];
}

function extractPostFromMarkdown(filePath, variant) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Split by variant headers
  const sections = content.split(/## Post Variant/);

  for (const section of sections) {
    if (section.includes(variant)) {
      // Extract everything between this variant and the next `---` or variant
      const postMatch = section.match(/[^\n]*\n([\s\S]*?)(?:\n---|\n## Post Variant)/);
      if (postMatch) {
        return postMatch[1].trim();
      }
    }
  }

  return null;
}

function getCurrentWeek() {
  const start = new Date(2026, 4, 5); // May 5, 2026 - week 0
  const now = new Date();
  const diff = now - start;
  const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
  return weekNumber;
}

exports.handler = async (event, context) => {
  try {
    console.log('🚀 Driver Pilot Social Post Publishing Started');

    if (!process.env.BLOTATO_API_KEY) {
      throw new Error('Missing BLOTATO_API_KEY');
    }

    // Read post variants from markdown file
    const postFilePath = path.join(process.cwd(), '..', 'rin-driver-app', 'DRIVER_PILOT_SOCIAL_POSTS.md');
    if (!fs.existsSync(postFilePath)) {
      throw new Error(`Post file not found: ${postFilePath}`);
    }

    // Determine which variant to publish this week
    const weekNumber = getCurrentWeek();
    const variantKey = getPostVariant(weekNumber);
    console.log(`📅 Week ${weekNumber}: Publishing ${variantKey}`);

    // Extract the post content
    const postContent = extractPostFromMarkdown(postFilePath, variantKey);
    if (!postContent) {
      throw new Error(`Could not extract post for ${variantKey}`);
    }

    console.log(`📝 Post content:\n${postContent.substring(0, 100)}...`);

    // Blotato account configuration for RIN Driver Network
    const accounts = {
      instagram: {
        account_id: '45382', // RIN Instagram
        platform: 'instagram'
      },
      facebook: {
        account_id: '30406', // RIN Facebook
        page_id: '1055037511034719',
        platform: 'facebook'
      }
    };

    let published = 0;
    const results = [];
    const failed = [];

    // Publish to Instagram
    try {
      console.log(`\n📡 Publishing to Instagram...`);
      const igPayload = {
        post: {
          accountId: accounts.instagram.account_id,
          platform: accounts.instagram.platform,
          text: postContent
        }
      };

      const igResult = await callBlotato('POST', '/v2/posts', igPayload);
      console.log(`   Response: ${igResult.statusCode}`);

      if (igResult.statusCode === 200 || igResult.statusCode === 201) {
        console.log(`   ✅ Instagram: posted`);
        published++;
        results.push({
          platform: 'instagram',
          status: 'published',
          variant: variantKey
        });
      } else {
        console.log(`   ❌ Instagram: ${igResult.statusCode}`);
        failed.push('instagram');
        results.push({
          platform: 'instagram',
          status: 'failed',
          statusCode: igResult.statusCode
        });
      }
    } catch (err) {
      console.log(`   ❌ Instagram: ${err.message}`);
      failed.push('instagram');
      results.push({
        platform: 'instagram',
        status: 'error',
        error: err.message
      });
    }

    // Publish to Facebook
    try {
      console.log(`\n📡 Publishing to Facebook...`);
      const fbPayload = {
        post: {
          accountId: accounts.facebook.account_id,
          platform: accounts.facebook.platform,
          text: postContent,
          pageId: accounts.facebook.page_id
        }
      };

      const fbResult = await callBlotato('POST', '/v2/posts', fbPayload);
      console.log(`   Response: ${fbResult.statusCode}`);

      if (fbResult.statusCode === 200 || fbResult.statusCode === 201) {
        console.log(`   ✅ Facebook: posted`);
        published++;
        results.push({
          platform: 'facebook',
          status: 'published',
          variant: variantKey
        });
      } else {
        console.log(`   ❌ Facebook: ${fbResult.statusCode}`);
        failed.push('facebook');
        results.push({
          platform: 'facebook',
          status: 'failed',
          statusCode: fbResult.statusCode
        });
      }
    } catch (err) {
      console.log(`   ❌ Facebook: ${err.message}`);
      failed.push('facebook');
      results.push({
        platform: 'facebook',
        status: 'error',
        error: err.message
      });
    }

    console.log(`\n✅ Publishing complete: ${published}/2 platforms published`);
    if (failed.length > 0) {
      console.log(`⚠️  Failed platforms: ${failed.join(', ')}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        published,
        failed: failed.length,
        week: weekNumber,
        variant: variantKey,
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('❌ Publishing failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
