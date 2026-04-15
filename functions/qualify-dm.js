/**
 * Qualify DM — Auto-score incoming DMs for lead quality
 * Triggered by linkedin-webhook.js after DM is stored
 * Updates linkedin_dms record with qualification_score, auto_qualified, and qualification_notes
 */

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Qualification thresholds and scoring rules
const QUALIFICATION_THRESHOLDS = {
  QUALIFIED_MIN: 0.60, // 60%+ = auto-qualified
  TITLE_KEYWORDS: {
    executive: { keywords: ["ceo", "founder", "chief", "president"], weight: 1.0 },
    director: { keywords: ["director", "vp", "vice president", "head of"], weight: 0.85 },
    manager: { keywords: ["manager", "lead", "senior"], weight: 0.60 },
  },
  INTENT_KEYWORDS: {
    high: { keywords: ["pricing", "timeline", "implementation", "demo", "trial", "cost", "budget"], weight: 1.0 },
    medium: { keywords: ["interested", "learn more", "tell me", "how does", "capabilities"], weight: 0.70 },
    low: { keywords: ["thanks", "great post", "cool", "interesting"], weight: 0.30 },
  },
};

/**
 * Score based on sender title
 */
function scoreTitleSignal(senderTitle) {
  if (!senderTitle) return 0.3; // No title info = low score

  const titleLower = senderTitle.toLowerCase();

  for (const [level, config] of Object.entries(QUALIFICATION_THRESHOLDS.TITLE_KEYWORDS)) {
    if (config.keywords.some(kw => titleLower.includes(kw))) {
      return config.weight;
    }
  }

  // If title is present but doesn't match keywords, assume mid-level
  return 0.5;
}

/**
 * Score based on message intent (keywords in message text)
 */
function scoreIntentSignal(messageText) {
  if (!messageText) return 0.1;

  const msgLower = messageText.toLowerCase();
  let maxIntentScore = 0.1; // Base score if no intent keywords found

  for (const [level, config] of Object.entries(QUALIFICATION_THRESHOLDS.INTENT_KEYWORDS)) {
    if (config.keywords.some(kw => msgLower.includes(kw))) {
      maxIntentScore = Math.max(maxIntentScore, config.weight);
    }
  }

  return maxIntentScore;
}

/**
 * Score based on company signals (size, revenue, industry)
 * Note: This is simplified; in production, would call external data provider
 */
function scoreCompanySignal(senderCompany) {
  if (!senderCompany) return 0.3;

  // List of high-value company signals (SaaS, tech, etc.)
  const highValueIndustries = ["saas", "startup", "venture", "tech", "software", "consulting", "platform"];
  const companyLower = senderCompany.toLowerCase();

  const isHighValue = highValueIndustries.some(ind => companyLower.includes(ind));
  return isHighValue ? 0.7 : 0.4;
}

/**
 * Calculate overall qualification score
 * Weighted average: title (30%), intent (50%), company (20%)
 */
function calculateQualificationScore(dmData) {
  const titleScore = scoreTitleSignal(dmData.sender_title);
  const intentScore = scoreIntentSignal(dmData.message_text);
  const companyScore = scoreCompanySignal(dmData.sender_company);

  // Weighted average
  const overallScore = titleScore * 0.3 + intentScore * 0.5 + companyScore * 0.2;

  return Math.round(overallScore * 100) / 100; // Round to 2 decimals
}

/**
 * Generate qualification reason and recommendation
 */
function generateQualificationReason(dmData, score) {
  const titleScore = scoreTitleSignal(dmData.sender_title);
  const intentScore = scoreIntentSignal(dmData.message_text);
  const companyScore = scoreCompanySignal(dmData.sender_company);

  const factors = [];

  if (titleScore >= 0.85) {
    factors.push("executive-level decision maker");
  } else if (titleScore >= 0.6) {
    factors.push("director/VP-level influencer");
  }

  if (intentScore >= 0.9) {
    factors.push("asking about pricing/implementation");
  } else if (intentScore >= 0.7) {
    factors.push("showing high interest");
  }

  if (dmData.sender_company && companyScore >= 0.7) {
    factors.push("high-value SaaS/tech background");
  }

  const reason =
    factors.length > 0
      ? factors.join(", ")
      : "inquiry received";

  let recommendedAction = "send_discovery_deck";
  if (score < QUALIFICATION_THRESHOLDS.QUALIFIED_MIN) {
    recommendedAction = "send_warm_response";
  } else if (titleScore >= 0.85) {
    recommendedAction = "schedule_call";
  }

  return { reason, recommendedAction };
}

/**
 * Qualify a DM record and update Supabase
 */
async function qualifyDM(dmRecord) {
  try {
    const qualificationScore = calculateQualificationScore(dmRecord);
    const isQualified = qualificationScore >= QUALIFICATION_THRESHOLDS.QUALIFIED_MIN;
    const { reason, recommendedAction } = generateQualificationReason(dmRecord, qualificationScore);

    console.log(`📊 Qualification for DM ${dmRecord.id}:`);
    console.log(`   Score: ${qualificationScore} (${isQualified ? "QUALIFIED" : "not qualified"})`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Recommended action: ${recommendedAction}`);

    // Update the DM record with qualification results
    const { data, error } = await supabase
      .from("linkedin_dms")
      .update({
        qualification_score: qualificationScore,
        auto_qualified: isQualified,
        qualification_notes: reason,
        next_action: recommendedAction,
        updated_at: new Date().toISOString(),
      })
      .eq("id", dmRecord.id)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to update DM qualification:", error.message);
      throw new Error(`Database update failed: ${error.message}`);
    }

    // If qualified, trigger conversion to outreach pipeline
    if (isQualified) {
      try {
        const { convertDMtoOutreach } = require("./dm-to-outreach");
        const conversionResult = await convertDMtoOutreach(data);
        console.log(`✓ Automatically converted to outreach: ${conversionResult.outreachId}`);
      } catch (conversionError) {
        console.warn("⚠️  Auto-conversion to outreach failed:", conversionError.message);
        // Don't throw - qualification is still successful even if conversion fails
      }
    }

    return {
      success: true,
      dmId: dmRecord.id,
      qualificationScore,
      isQualified,
      recommendedAction,
    };
  } catch (error) {
    console.error("❌ Qualification error:", error.message);
    throw error;
  }
}

/**
 * Netlify Function Handler (for manual trigger via API)
 */
exports.handler = async (event, context) => {
  console.log("📊 Received qualification request");

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid JSON payload" }),
      };
    }

    if (!body.dmRecord || !body.dmRecord.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing dmRecord with id" }),
      };
    }

    const result = await qualifyDM(body.dmRecord);

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("❌ Handler error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Export for use by other functions
exports.qualifyDM = qualifyDM;
