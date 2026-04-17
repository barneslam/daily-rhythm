exports.handler = async (event, context) => {
  const program = [
    {
      week: 1,
      status: 'in_progress',
      theme: 'Foundation & Research',
      targets: 20,
      goals: ['Identify ICP', 'Research 20 targets', 'Build lead list'],
      completed: true
    },
    {
      week: 2,
      status: 'in_progress',
      theme: 'Initial Outreach',
      targets: 20,
      goals: ['Send 20 connection requests', 'Establish rapport', 'Build credibility'],
      completed: false
    },
    {
      week: 3,
      status: 'pending',
      theme: 'Engagement & Qualification',
      targets: 15,
      goals: ['Follow up on connections', 'Qualify interest', 'Schedule discovery calls'],
      completed: false
    },
    {
      week: 4,
      status: 'pending',
      theme: 'Discovery Calls',
      targets: 10,
      goals: ['Conduct discovery calls', 'Identify pain points', 'Determine fit'],
      completed: false
    },
    {
      week: 5,
      status: 'pending',
      theme: 'Proposal Development',
      targets: 8,
      goals: ['Create custom proposals', 'Address objections', 'Build case studies'],
      completed: false
    },
    {
      week: 6,
      status: 'pending',
      theme: 'Negotiation & Closing',
      targets: 5,
      goals: ['Negotiate terms', 'Handle objections', 'Secure signatures'],
      completed: false
    },
    {
      week: 7,
      status: 'pending',
      theme: 'Onboarding Preparation',
      targets: 3,
      goals: ['Prepare onboarding', 'Set success metrics', 'Schedule kickoff'],
      completed: false
    },
    {
      week: 8,
      status: 'pending',
      theme: 'Scale & Optimize',
      targets: 20,
      goals: ['Replicate winning formula', 'Optimize messaging', 'Scale outreach'],
      completed: false
    }
  ];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ program })
  };
};
