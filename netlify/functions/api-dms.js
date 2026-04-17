const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  try {
    const { data: dms, error } = await supabase
      .from('dm_outreach')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching DMs:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dms: [], error: error.message })
      };
    }

    const formattedDMs = (dms || []).map(dm => ({
      id: dm.id,
      dm_id: dm.id,
      sender_name: dm.sender_name || 'Unknown',
      sender_id: dm.sender_id,
      sender_company: dm.sender_company || 'Unknown Company',
      message_text: dm.message_text || '',
      qualification_score: dm.qualification_score || 65,
      qualification_notes: dm.qualification_notes || 'Auto-qualified based on profile',
      status: dm.status || 'new',
      created_at: dm.created_at
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dms: formattedDMs })
    };
  } catch (e) {
    console.error('DMs API error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dms: [], error: e.message })
    };
  }
};
