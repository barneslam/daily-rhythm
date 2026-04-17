exports.handler = async (event, context) => {
  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Sample content data - in production this would come from database or CMS
    const sampleContent = [
      {
        filename: `${dateStr}-gtm-framework.md`,
        title: 'GTM FRAMEWORK',
        content: '# GTM Framework\n\n## Key Components\n- Market Positioning\n- Target Audience\n- Sales Strategy\n- Messaging Framework',
        status: 'draft',
        created_at: new Date().toISOString(),
        published: false
      },
      {
        filename: `${dateStr}-offer-positioning.md`,
        title: 'OFFER POSITIONING',
        content: '# Offer Positioning\n\n## Value Proposition\n- Unique benefits\n- Competitive advantages\n- Price positioning\n- Market differentiation',
        status: 'draft',
        created_at: new Date().toISOString(),
        published: false
      }
    ];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: sampleContent,
        date: dateStr,
        count: sampleContent.length
      })
    };
  } catch (e) {
    console.error('Content API error:', e.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: [], error: e.message })
    };
  }
};
