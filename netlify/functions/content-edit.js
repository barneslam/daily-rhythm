const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const path = event.path.split('/');
    const contentId = path[path.length - 2];

    const body = JSON.parse(event.body || '{}');
    const { linkedin_draft, instagram_draft } = body;

    const updateData = { updated_at: new Date().toISOString() };
    if (linkedin_draft) updateData.linkedin_draft = linkedin_draft;
    if (instagram_draft) updateData.instagram_draft = instagram_draft;

    const { error } = await supabase
      .from('content_drafts')
      .update(updateData)
      .eq('id', contentId);

    if (error) {
      console.error('Error updating content:', error);
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, message: 'Content updated' })
    };
  } catch (e) {
    console.error('Edit error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
