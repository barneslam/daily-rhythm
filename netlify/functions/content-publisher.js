const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Blotato API helper
function callBlotato(method, path, body = null) {
  return new Promise((resolve, reject) => {
    let bodyStr = null;
    const headers = {
      'blotato-api-key': process.env.BLOTATO_API_KEY,
      'Content-Type': 'application/json'
    };

    if (body) {
      bodyStr = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8');
    }

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
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// Schedule to Blotato
async function scheduleToBlotato(content, platform, scheduledTime) {
  try {
    // Account IDs from environment or fallback
    const accountMap = {
      linkedin: process.env.BLOTATO_LINKEDIN_ACCOUNT_ID || 'acct_linkedin_1',
      instagram: process.env.BLOTATO_INSTAGRAM_ACCOUNT_ID || 'acct_instagram_1'
    };

    const accountId = accountMap[platform];
    if (!accountId) {
      return { success: false, error: `No account configured for ${platform}` };
    }

    const payload = {
      accountId,
      platform,
      text: content,
      mediaUrls: [],
      scheduledTime: scheduledTime // ISO 8601 format
    };

    const result = await callBlotato('POST', '/posts', payload);

    console.log(`Blotato POST response: ${result.statusCode}`, result.data);

    if (result.statusCode >= 200 && result.statusCode < 300) {
      return { success: true, postId: result.data.id };
    } else {
      return { success: false, error: result.data.message || 'Blotato API error' };
    }
  } catch (e) {
    console.error('Blotato schedule error:', e.message);
    return { success: false, error: e.message };
  }
}

// Get approved content drafts
async function getApprovedContent() {
  try {
    const { data, error } = await supabase
      .from('gtm_drafts')
      .select('*')
      .eq('status', 'approved')
      .is('published_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching approved content:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('Fetch error:', e.message);
    return [];
  }
}

// Mark content as published
async function markPublished(contentId, platform, postId) {
  try {
    const { error } = await supabase
      .from('gtm_drafts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_to: platform,
        blotato_post_id: postId
      })
      .eq('id', contentId);

    if (error) {
      console.error('Error updating content:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Update error:', e.message);
    return false;
  }
}

// Main handler
exports.handler = async (event, context) => {
  try {
    console.log('🚀 Content publishing triggered');

    // Get approved content
    const approvedContent = await getApprovedContent();
    console.log(`📝 Found ${approvedContent.length} approved content drafts`);

    if (approvedContent.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'success',
          message: 'No approved content to publish',
          published_count: 0,
          timestamp: new Date().toISOString()
        })
      };
    }

    let publishedCount = 0;
    const results = [];

    // Schedule each approved draft
    for (const content of approvedContent) {
      const scheduledTime = content.scheduled_for || new Date().toISOString();

      // Schedule to LinkedIn
      if (content.linkedin_draft) {
        const linkedinResult = await scheduleToBlotato(content.linkedin_draft, 'linkedin', scheduledTime);
        if (linkedinResult.success) {
          await markPublished(content.id, 'linkedin', linkedinResult.postId);
          publishedCount++;
          results.push({
            business: content.business,
            platform: 'linkedin',
            success: true,
            scheduled_for: scheduledTime
          });
          console.log(`✓ Scheduled LinkedIn post for ${content.business} at ${scheduledTime}`);
        } else {
          results.push({
            business: content.business,
            platform: 'linkedin',
            success: false,
            error: linkedinResult.error
          });
          console.error(`✗ Failed to schedule LinkedIn for ${content.business}:`, linkedinResult.error);
        }
      }

      // Schedule to Instagram
      if (content.instagram_draft) {
        const instagramResult = await scheduleToBlotato(content.instagram_draft, 'instagram', scheduledTime);
        if (instagramResult.success) {
          await markPublished(content.id, 'instagram', instagramResult.postId);
          publishedCount++;
          results.push({
            business: content.business,
            platform: 'instagram',
            success: true,
            scheduled_for: scheduledTime
          });
          console.log(`✓ Scheduled Instagram post for ${content.business} at ${scheduledTime}`);
        } else {
          results.push({
            business: content.business,
            platform: 'instagram',
            success: false,
            error: instagramResult.error
          });
          console.error(`✗ Failed to schedule Instagram for ${content.business}:`, instagramResult.error);
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'success',
        approved_count: approvedContent.length,
        published_count: publishedCount,
        results,
        timestamp: new Date().toISOString()
      })
    };
  } catch (e) {
    console.error('Publishing error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'error',
        error: e.message
      })
    };
  }
};
