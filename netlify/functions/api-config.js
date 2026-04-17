const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const trackerPath = path.join(__dirname, '../..', 'tracker.json');
    const trackerData = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        week: trackerData.current_week || 1,
        weekly_targets: {
          messages_sent: 20,
          responses: 5,
          calls_booked: 2,
          revenue: 0
        },
        blocks: ['trigger-scan', 'build-deliver', 'closing']
      })
    };
  } catch (e) {
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
  }
};
