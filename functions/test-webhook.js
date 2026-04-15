/**
 * Test Helper — Manual webhook testing via HTTP GET
 * Call: GET /.netlify/functions/test-webhook?name=John+Doe&company=Acme&title=VP+Sales
 *
 * Generates a sample DM payload and POSTs it to linkedin-webhook.js
 * Returns the webhook response for verification
 */

const crypto = require("crypto");

/**
 * Generate a sample DM payload for testing
 */
function generateTestPayload(overrides = {}) {
  const now = new Date().toISOString();
  const defaults = {
    conversationId: `test-convo-${Date.now()}`,
    senderId: "linkedin-12345",
    senderName: "John Doe",
    senderTitle: "VP Sales",
    senderCompany: "Acme Corp",
    senderLinkedInUrl: "https://linkedin.com/in/johndoe",
    message: {
      text: "Hi, saw your post on GTM psychology. Interested in learning more.",
      timestamp: now,
    },
    sourceChannel: "the_strategy_pitch",
    sourcePost: {
      date: new Date().toISOString().split("T")[0],
      theme: "GTM psychology",
    },
  };

  return { ...defaults, ...overrides };
}

/**
 * Create HMAC-SHA256 signature for the payload
 */
function signPayload(payload, secret) {
  if (!secret) return null;
  const body = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * POST to linkedin-webhook and return result
 */
async function testWebhookDirectly(payload, signature, webhookUrl) {
  try {
    const body = JSON.stringify(payload);
    const headers = {
      "Content-Type": "application/json",
      "x-blotato-signature": signature || "",
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body,
    });

    const responseBody = await response.text();

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseBody,
    };
  } catch (error) {
    return {
      statusCode: 500,
      error: error.message,
    };
  }
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  console.log("🧪 Test webhook handler called");

  // Allow CORS and GET requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Use GET to test" }),
    };
  }

  try {
    // Parse query parameters for payload customization
    const queryParams = event.queryStringParameters || {};
    const payloadOverrides = {
      senderName: queryParams.name || "John Doe",
      senderTitle: queryParams.title || "VP Sales",
      senderCompany: queryParams.company || "Acme Corp",
      message: {
        text:
          queryParams.message ||
          "Hi, saw your post on GTM psychology. Very interested.",
        timestamp: new Date().toISOString(),
      },
    };

    // Generate test payload
    const payload = generateTestPayload(payloadOverrides);

    // Sign payload if secret is available
    const secret = process.env.LINKEDIN_WEBHOOK_SECRET;
    const signature = signPayload(payload, secret);

    // Determine the webhook URL (either absolute or relative)
    let webhookUrl;
    if (event.headers.host) {
      const protocol = event.headers["x-forwarded-proto"] || "https";
      webhookUrl = `${protocol}://${event.headers.host}/.netlify/functions/linkedin-webhook`;
    } else {
      // Fallback for local testing
      webhookUrl = "http://localhost:3001/.netlify/functions/linkedin-webhook";
    }

    console.log(`📤 Testing webhook at: ${webhookUrl}`);
    console.log(`📋 Payload: ${JSON.stringify(payload, null, 2)}`);
    console.log(`🔐 Signature: ${signature ? signature.substring(0, 20) + "..." : "none"}`);

    // Test the webhook
    const result = await testWebhookDirectly(payload, signature, webhookUrl);

    console.log(`✓ Webhook response: ${result.statusCode}`);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        testPayload: payload,
        signature: signature ? signature.substring(0, 40) + "..." : null,
        webhookUrl,
        webhookResponse: {
          statusCode: result.statusCode,
          body:
            typeof result.body === "string"
              ? JSON.parse(result.body || "{}")
              : result.body,
          error: result.error,
        },
        testUrl: `https://daily-lead-gen-track.netlify.app/.netlify/functions/test-webhook`,
        examples: [
          `/.netlify/functions/test-webhook?name=Jane+Smith&title=Director&company=TechCorp`,
          `/.netlify/functions/test-webhook?message=Can+we+discuss+your+GTM+pricing?`,
        ],
      }),
    };
  } catch (error) {
    console.error("❌ Test error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
    };
  }
};
