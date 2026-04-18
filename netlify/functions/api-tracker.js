const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const defaultTracker = {
  current_week: 1,
  start_date: new Date().toISOString().split('T')[0],
  pipeline_status: {
    identified: 20,
    messaged: 0,
    responded: 0,
    call_booked: 0,
    call_completed: 0,
    proposal_sent: 0,
    estimated_value: "$0 (pending first responses)"
  },
  days: {}
};

exports.handler = async (event, context) => {
  try {
    const { data: tracker, error } = await supabase
      .from('pipeline_tracker')
      .select('*')
      .single();

    if (error || !tracker) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultTracker)
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_week: tracker.current_week || defaultTracker.current_week,
        start_date: tracker.start_date || defaultTracker.start_date,
        pipeline_status: tracker.pipeline_status || defaultTracker.pipeline_status,
        days: tracker.days || defaultTracker.days
      })
    };
  } catch (e) {
    console.error('Tracker API error:', e.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultTracker)
    };
  }
};
