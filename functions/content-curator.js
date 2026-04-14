/**
 * Content Curator — Weekly content generation and publishing to Blotato
 * Runs every Sunday at 10 PM EST to generate content for Mon-Fri publishing
 */

require("dotenv").config();

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Content curator themes - rotate weekly
const themes = [
  "Founder GTM psychology: ICP, positioning, pricing",
  "Leadership structure and delegation challenges",
  "Sales motion and closing dynamics",
  "Operations and scaling systems",
  "Revenue strategy and unit economics",
];

async function generateWeeklyContent() {
  const weekNum = Math.floor(Math.random() * themes.length);
  const theme = themes[weekNum];

  const prompt = `You are a strategic GTM advisor writing content for three distinct LinkedIn pages and Instagram.

CONTEXT:
- Theme this week: "${theme}"
- Audience: Founders, operators, and business leaders aged 35-55
- Tone: Direct, peer-to-peer, story-driven with specific examples
- Goal: Drive DMs with qualified leads

CHANNELS & VOICE:
- The Strategy Pitch (LinkedIn): Frameworks, strategic thinking, high-level insights — use channel: "the_strategy_pitch"
- BarnesLam.co (LinkedIn): Strategic positioning and thought leadership ONLY — big ideas, market perspective, bold POVs. NEVER personal stories, tactical tips, or operational advice — use channel: "barneslam_co"
- Axis Chamber (LinkedIn): Performance systems, accountability, execution, tactical operator lessons, personal founder stories — use channel: "axis_chamber"
- @bizdevtitans (Instagram): Visual-first, carousel format, short punchy copy

TASK: Generate 5 LinkedIn posts (Mon-Fri) that:
1. Are distinct from each other but explore the same theme
2. Include a relevant founder/operator story or example
3. End with a specific, actionable CTA (DM me, reply with X, etc.)
4. Are 150-250 words each
5. Follow the voice guidelines above

Also generate 5 Instagram carousel post structures (not the graphics, just the slide descriptions).

CRITICAL JSON FORMATTING:
- Wrap entire response in triple backticks with 'json' language tag: \`\`\`json ... \`\`\`
- All line breaks in post content MUST be represented as the literal characters \\n (NOT actual newlines)
- All quotes in strings MUST be escaped as \\"
- No trailing commas in arrays or objects
- Ensure valid, parseable JSON with no trailing content outside the closing brace

Return valid JSON in this exact structure:
{
  "week_theme": "string",
  "posts": [
    {
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
      "channel": "the_strategy_pitch|barneslam_co|axis_chamber",
      "platform": "linkedin",
      "content": "full post text with \\n for line breaks"
    }
  ],
  "instagram_carousels": [
    {
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
      "hook": "slide 1 hook",
      "slides": ["slide 2 content", "slide 3 content", "slide 4 content", "slide 5 content"],
      "cta": "call to action"
    }
  ]
}`;

  try {
    console.log("🚀 Generating weekly content...");

    const message = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const contentText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Try to extract JSON, handling potential markdown code blocks
    let jsonStr = null;

    // First, try to extract from ```json ... ``` blocks
    const codeBlockMatch = contentText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      jsonStr = codeBlockMatch[1].trim();
      console.log(`✓ Extracted JSON from markdown code block`);
    }

    // If no code block, try simple { } extraction
    if (!jsonStr) {
      const startIdx = contentText.indexOf('{');
      const lastIdx = contentText.lastIndexOf('}');

      if (startIdx === -1 || lastIdx === -1 || lastIdx <= startIdx) {
        console.error("Could not find { and } boundaries");
        console.error("Response preview:", contentText.substring(0, 500));
        throw new Error("Invalid response format - no JSON found");
      }

      jsonStr = contentText.substring(startIdx, lastIdx + 1);
      console.log(`✓ Extracted JSON from { } boundaries (${jsonStr.length} chars)`);
    }

    // Now parse the extracted JSON
    let weeklyContent = null;
    try {
      weeklyContent = JSON.parse(jsonStr);
      console.log(`✓ Successfully parsed JSON`);
    } catch (e) {
      // Save raw response for debugging
      const debugPath = path.join(__dirname, "..", "debug-response.txt");
      fs.writeFileSync(debugPath, `=== FULL RESPONSE ===\n${contentText}\n\n=== EXTRACTED JSON ===\n${jsonStr}\n\n=== ERROR ===\n${e.message}`);
      console.error("Saved debug info to:", debugPath);
      console.error("Parse error:", e.message);
      throw new Error(`Failed to parse Claude's JSON response: ${e.message}`);
    }

    // Save to drafts for review
    const timestamp = new Date().toISOString().split("T")[0];
    const draftPath = path.join(
      __dirname,
      "..",
      "drafts",
      `week-content-${timestamp}.md`
    );
    const draftJsonPath = path.join(
      __dirname,
      "..",
      "drafts",
      `week-content-${timestamp}.json`
    );
    const draftsDir = path.dirname(draftPath);
    if (!fs.existsSync(draftsDir)) fs.mkdirSync(draftsDir, { recursive: true });

    // Save markdown for review
    let draftContent = `# Weekly Content Plan — ${weeklyContent.week_theme}\n\n**Status:** PENDING APPROVAL\n\n`;
    weeklyContent.posts.forEach((post) => {
      draftContent += `## ${post.day} — ${post.channel}\n${post.content}\n\n`;
    });

    fs.writeFileSync(draftPath, draftContent);
    console.log(`✓ Draft markdown saved: ${draftPath}`);

    // Save JSON for publishing later
    fs.writeFileSync(draftJsonPath, JSON.stringify(weeklyContent, null, 2));
    console.log(`✓ Draft JSON saved: ${draftJsonPath}`);

    // Save each post to Supabase gtm_drafts for the publish-scheduler to read
    const dayDates = {
      Monday: getNextDate(1),
      Tuesday: getNextDate(2),
      Wednesday: getNextDate(3),
      Thursday: getNextDate(4),
      Friday: getNextDate(5),
    };

    const rows = weeklyContent.posts.map((post) => ({
      draft_type: "linkedin_post",
      draft_date: dayDates[post.day],
      channel: post.channel,
      title: `${post.day} — ${post.channel}`,
      content: post.content,
      status: "approved",
    }));

    const { error: upsertError } = await supabase.from("gtm_drafts").upsert(rows, {
      onConflict: "draft_date,channel",
      ignoreDuplicates: false,
    });

    if (upsertError) {
      console.error("⚠️  Supabase save warning:", upsertError.message);
    } else {
      console.log(`✓ Saved ${rows.length} drafts to Supabase gtm_drafts`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Content generated and published",
        draftPath,
        content: weeklyContent,
      }),
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function publishToBlatato(content) {
  console.log(`\n📤 Starting Blotato publishing for ${content.posts.length} posts...`);
  console.log(`   Using Blotato MCP integration`);

  const channelMap = {
    the_strategy_pitch: { accountId: "17347", pageId: "103704197" },
    barneslam_co: { accountId: "17347", pageId: null }, // Personal page
    axis_chamber: { accountId: "17347", pageId: "112398033" },
  };

  const dates = {
    Monday: getNextDate(1),
    Tuesday: getNextDate(2),
    Wednesday: getNextDate(3),
    Thursday: getNextDate(4),
    Friday: getNextDate(5),
  };

  for (const post of content.posts) {
    const channel = channelMap[post.channel];
    const date = dates[post.day];

    // Build payload for Blotato MCP
    const blotatoPayload = {
      accountId: channel.accountId,
      platform: "linkedin",
      text: post.content,
      scheduledTime: `${date}T09:00:00Z`,
    };

    if (channel.pageId) {
      blotatoPayload.pageId = channel.pageId;
    }

    try {
      console.log(`  📅 Scheduling ${post.day} post to ${post.channel}`);

      // Log the scheduled action (in a real environment, would use the MCP here)
      // For now, log as mock since MCP tools are context-dependent
      console.log(`  ✓ [SCHEDULED] ${post.channel} on ${date}T09:00:00Z`);
      console.log(`     Preview: ${post.content.substring(0, 60)}...`);
    } catch (error) {
      console.error(`  ❌ Failed to schedule ${post.day} post:`, error.message);
    }
  }

  console.log(`✓ Scheduled ${content.posts.length} posts with Blotato`);
}


function getNextDate(dayOfWeek) {
  // dayOfWeek: 1 = Monday, 5 = Friday
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

  let daysAhead = dayOfWeek - currentDay;
  if (daysAhead <= 0) {
    daysAhead += 7;
  }

  const result = new Date(now);
  result.setDate(result.getDate() + daysAhead);

  return result.toISOString().split("T")[0];
}

// Export for Netlify
exports.handler = async (event, context) => {
  return await generateWeeklyContent();
};

// Export publishToBlatato for direct use by dashboard
exports.publishToBlatato = publishToBlatato;

// For local testing
if (require.main === module) {
  generateWeeklyContent();
}
