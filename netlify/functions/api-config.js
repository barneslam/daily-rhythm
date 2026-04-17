exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      week: 1,
      weekly_targets: {
        messages_sent: 20,
        responses: 5,
        calls_booked: 2,
        revenue: 0
      },
      blocks: ['trigger-scan', 'build-deliver', 'closing']
    })
  };
};
