const fs = require('fs');
const path = require('path');

// All 15 validated companies with scores
const companies = [
  {
    rank: 1, company: 'HockeyStack', website: 'hockeystack.com',
    founder: 'Buğra Gündüz / Emir Atli', location: 'San Francisco, CA',
    employees: '35-65', revenue_est: '$10M+ ARR',
    founder_activity: 3, hiring_signal: 2, weak_positioning: 1, ai_gap: 1, crm_signal: 1, total: 8,
    linkedin_founder: 'https://linkedin.com/in/emiratli',
    hiring_roles: 'Revenue team roles, Chief of Staff (YC Jobs)',
    positioning_gap: 'Shifting from "B2B attribution" to "Revenue Agents" — stretch claim vs actual product',
    ai_claim: 'Revenue Agents for Enterprise — post-$50M Bessemer raise claim',
    crm_gap: 'Complex attribution stack, teams struggle to adopt',
    notes: 'Emir Atli generates 3M+ monthly LinkedIn impressions. $50M Bessemer funded. Urgent revenue architecture gap.'
  },
  {
    rank: 2, company: 'Mutiny', website: 'mutinyhq.com',
    founder: 'Jaleh Rezaei', location: 'San Francisco, CA',
    employees: '78', revenue_est: '$20.7M',
    founder_activity: 3, hiring_signal: 2, weak_positioning: 1, ai_gap: 1, crm_signal: 1, total: 8,
    linkedin_founder: 'https://linkedin.com/in/jaleh',
    hiring_roles: 'VP Sales, GTM roles (ongoing)',
    positioning_gap: '"Turn wasted marketing spend into revenue" — targets any B2B company, no ICP specificity',
    ai_claim: 'AI personalization claims but crowded category with no stated wedge',
    crm_gap: 'Hiring for sales ops / GTM operations roles',
    notes: 'Series B. Broad ICP. Jaleh posts multiple times/week. Revenue architecture engagement.'
  },
  {
    rank: 3, company: 'Attio', website: 'attio.com',
    founder: 'Nicolas Sharp', location: 'London / New York',
    employees: '62-115', revenue_est: '$1.8M ARR',
    founder_activity: 2, hiring_signal: 2, weak_positioning: 2, ai_gap: 1, crm_signal: 1, total: 8,
    linkedin_founder: 'https://linkedin.com/in/nicolassharp',
    hiring_roles: 'Doubling headcount post-Series B',
    positioning_gap: '"Ask more from CRM" — no stated ICP or vertical, $75M funded on $1.8M ARR',
    ai_claim: 'AI-native CRM — feature claims without differentiating wedge',
    crm_gap: 'Building replacement CRM — struggling with enterprise go-to-market',
    notes: '$75M raised vs $1.8M ARR is the clearest revenue architecture gap on the list. URGENT.'
  },
  {
    rank: 4, company: 'Warmly', website: 'warmly.ai',
    founder: 'Max Greenwald', location: 'San Francisco, CA',
    employees: '35-50', revenue_est: '$3M ARR',
    founder_activity: 3, hiring_signal: 2, weak_positioning: 1, ai_gap: 0, crm_signal: 1, total: 7,
    linkedin_founder: 'https://linkedin.com/in/maxgreenwald',
    hiring_roles: 'Sales + marketing team doubling post-Series A',
    positioning_gap: '"Autonomous revenue orchestration for SMB" — horizontal platform, crowded AI-GTM category',
    ai_claim: 'Actually has AI execution — intent data + agent orchestration (reduced score)',
    crm_gap: 'Hiring multiple sales ops roles post-raise',
    notes: '$17M Series A. Max Greenwald posts daily. 215+ comment threads per post. Very reachable.'
  },
  {
    rank: 5, company: 'Dock', website: 'dock.us',
    founder: 'Alex Kracov', location: 'San Francisco, CA',
    employees: '4-15', revenue_est: '$3.2M',
    founder_activity: 3, hiring_signal: 1, weak_positioning: 1, ai_gap: 1, crm_signal: 1, total: 7,
    linkedin_founder: 'https://linkedin.com/in/alexkracov',
    hiring_roles: 'Early-stage, no current VP Sales',
    positioning_gap: 'Multiple AI claims (AI Enablement Agent, AI-native content hub) for a 4-15 person company',
    ai_claim: 'AI claims ahead of product reality at this stage',
    crm_gap: 'Founder-led sales, no structured CRM motion yet',
    notes: 'Alex Kracov runs "Grow & Tell" show, writes prolifically. $3.2M ARR inflection point.'
  },
  {
    rank: 6, company: 'Jiminny', website: 'jiminny.com',
    founder: 'Tom Lavery', location: 'London / US',
    employees: '60-90', revenue_est: '~£5M ARR',
    founder_activity: 2, hiring_signal: 1, weak_positioning: 1, ai_gap: 2, crm_signal: 1, total: 7,
    linkedin_founder: 'https://linkedin.com/in/tomlavery',
    hiring_roles: 'Team expanded 30% post-Series A',
    positioning_gap: 'AI conversation intelligence in Gong-dominated category — no differentiation stated',
    ai_claim: '"AI-powered" in category with Gong ($7.2B), Chorus, Clari — claim is table stakes, not differentiator',
    crm_gap: 'CRM integration complexity is a recurring adoption challenge in this category',
    notes: 'Tom posts 2-3x/month on sales coaching. AI positioning gap vs Gong is the pitch entry point.'
  },
  {
    rank: 7, company: 'Proposify', website: 'proposify.com',
    founder: 'Kyle Racki', location: 'Halifax, NS',
    employees: '85', revenue_est: '$11M',
    founder_activity: 2, hiring_signal: 1, weak_positioning: 1, ai_gap: 1, crm_signal: 1, total: 6,
    linkedin_founder: 'https://linkedin.com/in/kyleracki',
    hiring_roles: 'Steady growth, recent marketing hires',
    positioning_gap: 'Targets "any company that sends proposals" — no ICP limits pricing power at $11M',
    ai_claim: 'AI template generator in 2025 is a bolt-on feature, not product rearchitecture',
    crm_gap: 'Horizontal proposal tool with weak pipeline integration',
    notes: 'Canadian SaaS. 40K subscriber newsletter. Kyle is a published author + consistent poster.'
  },
  {
    rank: 8, company: 'Trainual', website: 'trainual.com',
    founder: 'Chris Ronzio', location: 'Scottsdale, AZ',
    employees: '126', revenue_est: '$32.6M',
    founder_activity: 3, hiring_signal: 1, weak_positioning: 1, ai_gap: 1, crm_signal: 0, total: 6,
    linkedin_founder: 'https://linkedin.com/in/chrisronzio',
    hiring_roles: 'Ops + enablement roles',
    positioning_gap: '"Systematize your business" — targets SMBs broadly without ICP segmentation',
    ai_claim: 'AI quiz + training generators are incremental additions, not AI-native product',
    crm_gap: 'No clear CRM misuse signal',
    notes: 'May exceed $30M ceiling. Chris is prolific — podcast host, author, consistent LinkedIn poster.'
  },
  {
    rank: 9, company: 'Lavender', website: 'lavender.ai',
    founder: 'William Ballance / Will Allred', location: 'New York, NY',
    employees: '6-10', revenue_est: 'Early stage',
    founder_activity: 3, hiring_signal: 0, weak_positioning: 1, ai_gap: 1, crm_signal: 1, total: 6,
    linkedin_founder: 'https://linkedin.com/in/williamballance',
    hiring_roles: 'No VP Sales hiring — product-led growth stage',
    positioning_gap: 'Rebranding to "Ora" — ICP and positioning identity still being defined mid-pivot',
    ai_claim: 'Email AI in a crowded category, mid-rebrand makes positioning unclear',
    crm_gap: 'Founder-managed revenue, no CRM structure yet',
    notes: 'Will Allred posts near-daily. Mid-pivot to Ora creates positioning opportunity. Very early stage.'
  },
  {
    rank: 10, company: 'Knak', website: 'knak.com',
    founder: 'Pierce Ujjainwalla', location: 'Ottawa, ON',
    employees: '78', revenue_est: 'Est. $8-15M',
    founder_activity: 2, hiring_signal: 2, weak_positioning: 0, ai_gap: 1, crm_signal: 1, total: 6,
    linkedin_founder: 'https://linkedin.com/in/pierceujjainwalla',
    hiring_roles: 'VP Marketing hired, blog post on "9 lessons hiring VPs" — active build-out',
    positioning_gap: 'Actually strong positioning (enterprise marketing production) — lower score intentional',
    ai_claim: 'AI features added incrementally, not a core wedge',
    crm_gap: 'RevOps + marketing ops hiring signal visible',
    notes: 'Canadian tech. Good positioning but scaling sales motion. $25M Series A. Strong hiring signal.'
  },
  {
    rank: 11, company: 'Commsor', website: 'commsor.com',
    founder: 'Mac Reddin', location: 'New York, NY',
    employees: '42', revenue_est: '$8.4M',
    founder_activity: 3, hiring_signal: 1, weak_positioning: 0, ai_gap: 0, crm_signal: 1, total: 5,
    linkedin_founder: 'https://linkedin.com/in/macreddin',
    hiring_roles: 'Hiring AEs — building sales layer now',
    positioning_gap: '"Go-to-Network" is creative and specific — strong positioning reduces score',
    ai_claim: 'Not claiming AI — reduced score',
    crm_gap: 'AE hiring = CRM/pipeline management coming',
    notes: 'Near-term prospect as sales team builds. Mac writes weekly essays on community + revenue. $16M Series A.'
  },
  {
    rank: 12, company: 'Rilla', website: 'rilla.com',
    founder: 'Sebastian Jimenez', location: 'New York, NY',
    employees: '58+', revenue_est: '$14M-$40M+',
    founder_activity: 3, hiring_signal: 2, weak_positioning: 0, ai_gap: 0, crm_signal: 0, total: 5,
    linkedin_founder: 'https://linkedin.com/in/sebastianjimenez',
    hiring_roles: 'Active hiring for field sales team',
    positioning_gap: 'Specific ICP (field sales for HVAC, home improvement, dental) — strong positioning',
    ai_claim: 'Genuine AI product — not a marketing wrapper',
    crm_gap: 'No CRM misuse signal — strong sales motion already built',
    notes: 'May have exceeded $30M ceiling. 100+ comments per LinkedIn post. Likely outgrown the target window.'
  },
  {
    rank: 13, company: 'Cledara', website: 'cledara.com',
    founder: 'Cristina Vila Vives', location: 'New York / London',
    employees: '63', revenue_est: '$10.8M',
    founder_activity: 2, hiring_signal: 1, weak_positioning: 1, ai_gap: 0, crm_signal: 1, total: 5,
    linkedin_founder: 'https://linkedin.com/in/cristinavilavives',
    hiring_roles: 'Steady hiring, no urgent VP Sales signal',
    positioning_gap: 'SaaS spend management for finance teams — specific but limited differentiation',
    ai_claim: 'Not making AI claims — reduced score',
    crm_gap: 'Finance tooling category often has CRM adoption gaps',
    notes: 'B2B fintech, $20M Series A. Warmer outreach candidate — stable PMF, no urgent signal.'
  },
  {
    rank: 14, company: 'GoodTime.io', website: 'goodtime.io',
    founder: 'Ahryun Moon', location: 'Las Vegas, NV',
    employees: '68-86', revenue_est: '$17.8M',
    founder_activity: 2, hiring_signal: 1, weak_positioning: 0, ai_gap: 1, crm_signal: 1, total: 5,
    linkedin_founder: 'https://linkedin.com/in/ahryunmoon',
    hiring_roles: 'Marketing leadership hiring',
    positioning_gap: '"Leader in complex enterprise interview scheduling" — specific and defensible',
    ai_claim: 'AI scheduling claims in established HR tech category',
    crm_gap: 'HR tech teams often have CRM adoption gaps for sales side',
    notes: 'Inc. Female Founders 500 (2025). Post Series A+. Warmer prospect — solid PMF.'
  },
  {
    rank: 15, company: 'Screenloop', website: 'screenloop.com',
    founder: 'Anton Boner', location: 'London, UK',
    employees: '25+', revenue_est: 'N/A',
    founder_activity: 1, hiring_signal: 0, weak_positioning: 1, ai_gap: 1, crm_signal: 0, total: 3,
    linkedin_founder: '',
    hiring_roles: 'No recent VP Sales / Growth hiring',
    positioning_gap: '"AI ATS" — crowded category, no ICP differentiation',
    ai_claim: 'AI claims in ATS category with Greenhouse, Lever, Ashby competition',
    crm_gap: 'No CRM signal',
    notes: 'Weakest prospect. Minimal founder LinkedIn activity. No revenue data. Low urgency.'
  }
];

// CSV escape helper
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV(data) {
  const headers = [
    'Rank', 'Company', 'Website', 'Founder', 'Location', 'Employees', 'Revenue Est.',
    'Founder Activity (3)', 'Hiring Signal (2)', 'Weak Positioning (2)', 'AI Gap (2)', 'CRM Signal (1)', 'TOTAL SCORE',
    'Founder LinkedIn', 'Hiring Roles', 'Positioning Gap', 'AI Claim', 'CRM Gap', 'Notes'
  ];

  const rows = data.map(c => [
    c.rank, c.company, c.website, c.founder, c.location, c.employees, c.revenue_est,
    c.founder_activity, c.hiring_signal, c.weak_positioning, c.ai_gap, c.crm_signal, c.total,
    c.linkedin_founder, c.hiring_roles, c.positioning_gap, c.ai_claim, c.crm_gap, c.notes
  ]);

  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map(row => row.map(csvEscape).join(','))
  ];

  return lines.join('\n');
}

const outputPath = path.join(__dirname, 'target-companies.csv');
const csv = generateCSV(companies);
fs.writeFileSync(outputPath, csv, 'utf-8');

console.log(`✅ Excel-ready CSV created: ${outputPath}`);
console.log(`📊 ${companies.length} companies, sorted by score descending`);
console.log(`\nTop 5:`);
companies.slice(0, 5).forEach(c => console.log(`  ${c.rank}. ${c.company} — ${c.total}/10`));
