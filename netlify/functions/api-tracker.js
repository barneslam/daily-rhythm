exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_week: 1,
      start_date: "2026-04-14",
      pipeline_status: {
        identified: 20,
        messaged: 0,
        responded: 0,
        call_booked: 0,
        call_completed: 0,
        proposal_sent: 0,
        estimated_value: "$0 (pending first responses)"
      },
      days: {
        "2026-04-13": { messages_sent: 3, responses_received: 0, calls_booked: 0, revenue: 0 },
        "2026-04-14": { messages_sent: 2, responses_received: 0, calls_booked: 0, revenue: 0 },
        "2026-04-15": { messages_sent: 4, responses_received: 1, calls_booked: 0, revenue: 0 },
        "2026-04-17": { messages_sent: 1, responses_received: 0, calls_booked: 0, revenue: 0 }
      }
    })
  };
};
