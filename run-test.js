/**
 * Local test runner for DM Pipeline
 * Runs the test-dm-pipeline handler directly without HTTP
 */

require('dotenv').config();

const handler = require('./functions/test-dm-pipeline').handler;

// Mock event object for Netlify Functions
const mockEvent = {
  httpMethod: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
};

// Mock context object
const mockContext = {
  requestId: 'local-test-1',
};

async function runTest() {
  console.log('🧪 Running DM Pipeline Test Locally\n');

  try {
    const response = await handler(mockEvent, mockContext);

    console.log('\n📊 Test Response:');
    console.log('Status:', response.statusCode);

    if (response.body) {
      const result = JSON.parse(response.body);
      console.log(JSON.stringify(result, null, 2));

      // Summary
      console.log('\n' + '='.repeat(60));
      console.log('Test Summary:');
      console.log('='.repeat(60));
      console.log(`Total: ${result.summary.total}`);
      console.log(`Passed: ${result.summary.passed}`);
      console.log(`Failed: ${result.summary.failed}`);
      console.log(`Warned: ${result.summary.warned}`);

      if (result.summary.passed === result.summary.total) {
        console.log('\n✅ ALL TESTS PASSED!');
      } else {
        console.log('\n⚠️  SOME TESTS FAILED - Review details above');
      }
    }
  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    process.exit(1);
  }
}

runTest();
