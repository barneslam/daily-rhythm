// Scheduled function to publish daily recovery sprint content to Blotato
// Runs daily at 9 AM EST (14 UTC)

const schedule = {
  0: {
    day: "Monday",
    theme: "Opportunity Leakage Pain",
    image_url: "https://images.unsplash.com/photo-1600267165477-6d4cc741b379",
    excerpt: "You've spent $5K on leads. 15 of 20 conversations vanished. Not because the leads weren't good. Because follow-up broke down.",
    cta: "Message RECOVER to get started"
  },
  1: {
    day: "Tuesday",
    theme: "Wasted Lead Generation Spend",
    image_url: "https://unsplash.com/photos/office-desk-with-smartphone-and-financial-charts-heiYgqp0Tsk",
    excerpt: "You paid to find that lead. Then you ghosted them. Now you're spending MORE money trying to find new leads to replace the ones you already screwed up.",
    cta: "Message RECOVER"
  },
  2: {
    day: "Wednesday",
    theme: "Stalled Proposal Recovery",
    image_url: "https://unsplash.com/photos/woman-signing-on-white-printer-paper-beside-woman-about-to-touch-the-documents-HJckKnwCXxQ",
    excerpt: "You sent a proposal two months ago. They said 'we love it.' Now it's awkward and you don't know what to say. This is almost always recoverable.",
    cta: "Message RECOVER"
  },
  3: {
    day: "Thursday",
    theme: "Warm Referrals That Went Quiet",
    image_url: "https://images.unsplash.com/photo-1630487656049-6db93a53a7e9",
    excerpt: "Someone referred you. You got a response. Then nothing. Warm referrals are your highest-converting leads. You just need one message to re-engage them.",
    cta: "Message RECOVER"
  },
  4: {
    day: "Friday",
    theme: "Follow-Up Breakdown + Recovery Rhythm",
    image_url: "https://images.unsplash.com/photo-1435527173128-983b87201f4d",
    excerpt: "Conversations just drop. By month 6, you're frustrated because 'nobody's buying.' But that's not true. The follow-up rhythm just broke down.",
    cta: "Message RECOVER"
  },
  5: {
    day: "Saturday",
    theme: "Case Study — The $75K Conversation",
    image_url: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
    excerpt: "One message. Two hours. $75K deal. It wasn't a new lead. It wasn't expensive. It was just the right message at the right moment.",
    cta: "Message RECOVER"
  },
  6: {
    day: "Sunday",
    theme: "Founder Reality",
    image_url: "https://images.unsplash.com/photo-1511203466129-824e631920d7",
    excerpt: "You're good at building and selling. What you're not good at is follow-up. The good news? This is one of the easiest things to fix.",
    cta: "Message RECOVER to get started"
  }
};

exports.handler = async (event, context) => {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Convert to 0-6 index where 0 = Monday
    const scheduleIndex = (dayOfWeek + 6) % 7;
    const todayPost = schedule[scheduleIndex];

    // Log the scheduled post info (for monitoring)
    console.log(`Recovery Sprint Daily Post - ${todayPost.day}:`, {
      theme: todayPost.theme,
      image: todayPost.image_url,
      timestamp: new Date().toISOString()
    });

    // Return post data (could be used for dashboard display or manual scheduling)
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Ready to publish: ${todayPost.theme}`,
        post: todayPost,
        instructions: "This post is ready to publish via Blotato. Visit the dashboard to schedule or publish manually."
      })
    };
  } catch (error) {
    console.error("Error in publish-recovery-sprint:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process daily post" })
    };
  }
};
