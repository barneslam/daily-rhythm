exports.handler = async (event, context) => {
  const weeks = {
    1: {
      theme: 'Foundation & Research',
      goal: 'Identify and research ICP target accounts',
      targets: { discovered: 20, qualified: 15 },
      checkpoint: 'Complete lead list with 20 targets'
    },
    2: {
      theme: 'Initial Outreach',
      goal: 'Send personalized connection requests to all targets',
      targets: { connections_sent: 20, accepted: 8 },
      checkpoint: 'Maintain 3+ warm conversations'
    },
    3: {
      theme: 'Engagement & Qualification',
      goal: 'Qualify interest and identify decision makers',
      targets: { responded: 12, qualified: 8 },
      checkpoint: 'Schedule 3-5 discovery calls'
    },
    4: {
      theme: 'Discovery Calls',
      goal: 'Conduct discovery calls to understand needs',
      targets: { calls_completed: 5, fit_confirmed: 4 },
      checkpoint: 'Document 4 qualified opportunities'
    },
    5: {
      theme: 'Proposal Development',
      goal: 'Create custom proposals addressing pain points',
      targets: { proposals_sent: 4, pending_review: 4 },
      checkpoint: '4 proposals in customer review cycle'
    },
    6: {
      theme: 'Negotiation & Closing',
      goal: 'Negotiate terms and secure commitments',
      targets: { in_negotiation: 3, closed: 1 },
      checkpoint: 'First revenue deal closed'
    },
    7: {
      theme: 'Onboarding Preparation',
      goal: 'Prepare customers for successful onboarding',
      targets: { onboarded: 1, scheduled: 2 },
      checkpoint: 'Customer success plan documented'
    },
    8: {
      theme: 'Scale & Optimize',
      goal: 'Replicate winning formula and optimize process',
      targets: { new_targets: 20, process_documented: 1 },
      checkpoint: 'Standardized playbook ready for scaling'
    }
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weeks })
  };
};
