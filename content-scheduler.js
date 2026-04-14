/**
 * Content Scheduler — Runs weekly content curation every Sunday at 10 PM EST
 * Place this in your server startup or run as a background service
 */

const cron = require("node-cron");
const contentCurator = require("./functions/content-curator");

// Schedule: Every Sunday at 10 PM EST (UTC-5, so 2 AM Monday UTC)
// "0 22 * * 0" = 10 PM every Sunday (local time)
const weeklySchedule = "0 22 * * 0";

function startContentScheduler() {
  console.log("📅 Content Scheduler started");
  console.log(`   Running every Sunday at 10 PM EST`);
  console.log(`   (Will publish Mon-Fri at 9 AM EST)\n`);

  const task = cron.schedule(weeklySchedule, async () => {
    console.log("\n🚀 [SCHEDULER] Weekly content curation triggered...");

    try {
      const result = await contentCurator.handler({});
      const response = JSON.parse(result.body);

      if (result.statusCode === 200) {
        console.log("✅ [SCHEDULER] Content generated and published");
        console.log(`   Draft: ${response.draftPath}`);
        console.log(`   Posts: ${response.content.posts.length} LinkedIn posts`);
      } else {
        console.error("❌ [SCHEDULER] Failed to generate content");
        console.error(response.error);
      }
    } catch (error) {
      console.error("❌ [SCHEDULER] Error:", error.message);
    }
  });

  return task;
}

// Export for integration into server
module.exports = {
  startContentScheduler,
};
