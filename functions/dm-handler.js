/**
 * DM Handler — Netlify Edge Function
 * Receives incoming DMs from Blotato webhook
 * Creates leads in GTM dashboard + tracks engagement
 *
 * Webhook source: Blotato DM webhook → /api/dm-handler
 */

const { handleDMAndCreateLead } = require('../curation-skill');

exports.handler = async (event, context) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.sender_name || !body.message_text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: sender_name, message_text' })
      };
    }

    console.log(`📬 DM received from ${body.sender_name}: "${body.message_text}"`);

    // Process DM and create lead
    const lead = await handleDMAndCreateLead({
      sender_name: body.sender_name,
      sender_email: body.sender_email || '',
      message_text: body.message_text,
      source_content_id: body.source_content_id || body.piece_title || 'unknown'
    });

    if (lead) {
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          message: `Lead created for ${body.sender_name}`,
          lead_id: lead.id
        })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create lead' })
      };
    }

  } catch (error) {
    console.error('DM handler error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
