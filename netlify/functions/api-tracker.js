exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      days: {
        "2026-04-17": {
          messages_sent: 0,
          responses_received: 0,
          calls_booked: 0,
          revenue: 0
        }
      }
    })
  };
};
