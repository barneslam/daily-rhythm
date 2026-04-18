const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const defaultConfig = {
  week: 1,
  weekly_targets: {
    messages_sent: 20,
    responses: 5,
    calls_booked: 2,
    revenue: 0
  },
  blocks: ['trigger-scan', 'build-deliver', 'closing']
};

exports.handler = async (event, context) => {
  try {
    const { data: config, error } = await supabase
      .from('pipeline_config')
      .select('*')
      .single();

    if (error || !config) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultConfig)
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week: config.current_week || defaultConfig.week,
        weekly_targets: config.weekly_targets || defaultConfig.weekly_targets,
        blocks: config.blocks || defaultConfig.blocks
      })
    };
  } catch (e) {
    console.error('Config API error:', e.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultConfig)
    };
  }
};
