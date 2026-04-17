exports.handler = async (event, context) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'healthy',
        environment: {
          supabase_url_set: !!supabaseUrl,
          supabase_key_set: !!supabaseKey,
          node_env: process.env.NODE_ENV || 'production',
          function_version: '1.0.0'
        },
        timestamp: new Date().toISOString()
      })
    };
  } catch (e) {
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
