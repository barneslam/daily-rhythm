const Anthropic = require("@anthropic-ai/sdk");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { message, context, save } = JSON.parse(event.body || "{}");

    if (!message) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing message data" }) };
    }

    // Save-only mode: persist an already-regenerated message back to Supabase
    if (save && message.id) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
      );
      const { error } = await supabase
        .from("outreach_messages")
        .update({
          subject: message.subject,
          full_body: message.full_body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", message.id);

      if (error) throw error;
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: true }),
      };
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stageInstructions = {
      connect: {
        goal: "Open a thread. Show you noticed something specific about them. No pitch, no ask.",
        rules: [
          "Reference one specific, visible signal — a post, announcement, job listing, or interview",
          "Under 60 words",
          "End with a statement, not a question — let curiosity do the work",
          "Zero mention of your offer, services, or any ask",
          "Tone: peer observation, direct, no flattery"
        ]
      },
      warm: {
        goal: "Establish credibility and authority. Give something useful with no strings attached.",
        rules: [
          "Share a specific insight, breakdown, or pattern directly relevant to their visible situation",
          "Under 100 words",
          "No meeting ask — at most a soft open question at the end",
          "No links unless genuinely useful",
          "Tone: operator sharing a real observation, confident but not salesy"
        ]
      },
      discover: {
        goal: "Understand their actual situation before proposing anything.",
        rules: [
          "Ask ONE specific, open-ended diagnostic question about their current situation",
          "Question must be based on their signals — not generic",
          "Under 60 words",
          "No mention of your offer or services",
          "Tone: curious, diagnostic, not leading them toward a sale"
        ]
      },
      ask: {
        goal: "Request a 15-min call now that credibility is established and you understand their situation.",
        rules: [
          "Reference what you've learned about their specific situation",
          "Make the ask specific to the problem identified — not generic",
          "Use this booking link: https://calendly.com/barnes-lam/free-consultation-24-hour-business-sprint",
          "Under 80 words",
          "ONE ask only — no alternatives or multiple CTAs",
          "Tone: direct and specific, not 'would love to connect'"
        ]
      }
    };

    const stage = stageInstructions[message._stage || stage || "connect"];

    const systemPrompt = `You are writing outreach messages on behalf of Barnes Lam, a GTM execution coach who helps B2B operators and founders fix stalled growth.

Barnes's positioning:
- Specialises in GTM architecture, pipeline design, and revenue execution
- Works with Series A-B SaaS and AI companies with product-market fit but flat pipeline
- Direct, no-fluff, operator-to-operator communication style
- Never uses: "synergy", "circle back", "touch base", "reach out", "hope this finds you well"
- Messages are always specific to a visible trigger about the recipient`;

    const userPrompt = `Write a Stage ${stage.goal.split(".")[0]} outreach message for ${message.name} at ${message.business || "their company"}.

STAGE GOAL: ${stage.goal}

RULES FOR THIS STAGE:
${stage.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

ORIGINAL MESSAGE (for context on the person and their trigger):
Subject: ${message.subject}
${message.full_body}

${context ? `ADDITIONAL INSTRUCTIONS FROM BARNES:\n${context}\n` : ""}
Return ONLY a JSON object:
{
  "subject": "the subject line",
  "body": "the message body"
}
No markdown, no preamble — raw JSON only.`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content[0]?.text ?? "{}";

    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : null;
    }

    if (!result?.body) {
      throw new Error("Invalid response format from Claude");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: result.subject, body: result.body }),
    };

  } catch (err) {
    console.error("regen-message error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
