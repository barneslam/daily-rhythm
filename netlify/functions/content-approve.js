const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const path = event.path.split('/');
    const contentId = path[path.length - 2];

    const { error } = await supabase
      .from('content_drafts')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId);

    if (error) {
      console.error('Error approving content:', error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Content approved' })
    };
  } catch (e) {
    console.error('Approve error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
