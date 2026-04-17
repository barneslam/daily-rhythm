const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    const trackerPath = path.join(__dirname, '../..', 'tracker.json');
    const trackerData = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackerData)
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_week: 1,
        days: {}
      })
    };
  }
};
