/**
 * Publish Scheduler — Automated publishing of approved drafts
 * Runs daily at 09:00 UTC (Mon-Fri) to publish that day's content
 */

const fs = require("fs");
const path = require("path");

// Helper to find today's draft file
function getTodaysDraftFile() {
  const today = new Date().toISOString().split("T")[0];
  const draftPath = path.join(__dirname, "..", "drafts", `week-content-*.json`);

  // Since we can't use glob in serverless, we look for the most recent draft
  const draftsDir = path.join(__dirname, "..", "drafts");

  if (!fs.existsSync(draftsDir)) {
    return null;
  }

  const files = fs.readdirSync(draftsDir)
    .filter(f => f.startsWith("week-content-") && f.endsWith(".json"))
    .sort()
    .reverse();

  return files.length > 0 ? path.join(draftsDir, files[0]) : null;
}

// Import publishToBlatato from content-curator
let publishToBlatato;
try {
  const contentCurator = require("./content-curator");
  publishToBlatato = contentCurator.publishToBlatato;
} catch (e) {
  console.error("Failed to load publishToBlatato:", e.message);
}

async function publishScheduledContent() {
  const draftFile = getTodaysDraftFile();

  if (!draftFile || !fs.existsSync(draftFile)) {
    console.log("⏭️  No draft file found for today");
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "No draft to publish" }),
    };
  }

  try {
    const draftContent = JSON.parse(fs.readFileSync(draftFile, "utf-8"));

    console.log(`📅 Publishing content from ${path.basename(draftFile)}`);
    console.log(`   Posts: ${draftContent.posts.length}`);

    // Call the publishing function
    await publishToBlatato(draftContent);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Content published successfully",
        file: path.basename(draftFile),
        postCount: draftContent.posts.length,
      }),
    };
  } catch (error) {
    console.error("❌ Publishing failed:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

// Netlify Scheduled Function
exports.handler = async (event, context) => {
  // Scheduled functions pass `X-Forwarded-For: scheduler` header
  if (event.headers && event.headers["x-forwarded-for"]?.includes("scheduler")) {
    return await publishScheduledContent();
  }

  // Allow manual trigger via HTTP
  return await publishScheduledContent();
};
