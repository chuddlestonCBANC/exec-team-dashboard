import {
  PillarWithScore,
  ExecutiveWithDetails,
  MetricWithDetails,
  Pillar,
  Executive,
  Metric,
  Commitment,
  CommitmentUpdate,
  Narrative,
  MetricHistory,
  DashboardData,
  DashboardDataExtended,
  OverviewSummary,
  ComparisonMode,
  TimePeriod,
  TalkingItem,
  MetricReviewItem,
  MeetingNotes,
} from '@/types';
import { getMetricStatus, getPercentageOfTarget, getPillarScore, calculatePillarStatus } from '@/lib/utils/scoring';
import { getCurrentWeekOf } from '@/lib/utils/formatting';
import { subDays } from 'date-fns';

// Base Pillars
const pillars: Pillar[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'New Revenue & Market Expansion',
    description: 'Metrics tracking new business acquisition, pipeline growth, and market penetration',
    colorThresholds: { green: 90, yellow: 70 },
    sortOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Customer Value & Expansion',
    description: 'Metrics tracking existing customer growth, upsells, and cross-sells',
    colorThresholds: { green: 90, yellow: 70 },
    sortOrder: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Retention & Customer Success',
    description: 'Metrics tracking customer retention, satisfaction, and health scores',
    colorThresholds: { green: 90, yellow: 70 },
    sortOrder: 3,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Operational Excellence',
    description: 'Metrics tracking engineering velocity, quality, and operational efficiency',
    colorThresholds: { green: 90, yellow: 70 },
    sortOrder: 4,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Base Executives
const executives: Executive[] = [
  {
    id: 'aaaa1111-1111-1111-1111-111111111111',
    name: 'Hank Seale',
    title: 'Chief Executive Officer',
    headshotUrl: 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af86ee2da5ea768e794288_2024Hapax-Hank-KPP09626-Website.jpg',
    email: 'hank@hapax.ai',
    sortOrder: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'aaaa2222-2222-2222-2222-222222222222',
    name: 'Jennifer Harris',
    title: 'Chief Financial Officer',
    headshotUrl: 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6a72fdc5fcafa067_2024Hapax-Jennifer-KPP08852-Website.jpg',
    email: 'jennifer@hapax.ai',
    sortOrder: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'aaaa3333-3333-3333-3333-333333333333',
    name: 'Kevin Green',
    title: 'Chief Marketing Officer',
    headshotUrl: 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8aa671a041b4f7c52f_2024Hapax-Kevin-KPP08849-Website.jpg',
    email: 'kevin@hapax.ai',
    sortOrder: 3,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'aaaa4444-4444-4444-4444-444444444444',
    name: 'Aaron Kwan',
    title: 'Chief Revenue Officer',
    headshotUrl: 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8ac0a816c3a5a4784b_2024Hapax-AaronKwan-Website.jpg',
    email: 'aaron@hapax.ai',
    sortOrder: 4,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'aaaa5555-5555-5555-5555-555555555555',
    name: 'Brian Huddleston',
    title: 'Chief Technology Officer',
    headshotUrl: 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a1269b738944c73d4_2024Hapax-Brian-KPP08874-Website.jpg',
    email: 'brian@hapax.ai',
    sortOrder: 5,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'aaaa6666-6666-6666-6666-666666666666',
    name: 'Greg Varnell',
    title: 'Chief Product Officer',
    headshotUrl: 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6ccd77ec450cd77e_2024Hapax-Connor-KPP08889-Website.jpg',
    email: 'greg@hapax.ai',
    sortOrder: 6,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'aaaa7777-7777-7777-7777-777777777777',
    name: 'Connor Huddleston',
    title: 'Chief Strategy Officer',
    headshotUrl: 'https://cdn.prod.website-files.com/65f04e8dba16e343e3820804/67af6f8a6ccd77ec450cd77e_2024Hapax-Connor-KPP08889-Website.jpg',
    email: 'connor@hapax.ai',
    sortOrder: 7,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Helper to create metric with new fields
function createMetric(
  id: string,
  pillarId: string,
  name: string,
  description: string,
  targetValue: number,
  currentValue: number,
  previousValue: number,
  metricType: 'key_result' | 'leading_indicator' | 'quality',
  format: 'number' | 'currency' | 'percentage',
  dataSource: 'hubspot' | 'jira' | 'sheets' | 'manual',
  comparisonMode: ComparisonMode,
  cadence: TimePeriod,
  parentMetricId?: string
): Metric {
  return {
    id,
    pillarId,
    name,
    description,
    dataSource,
    apiConfig: {},
    targetValue,
    currentValue,
    previousValue,
    warningThreshold: 70,
    criticalThreshold: 50,
    trendDirection: currentValue > previousValue ? 'up' : currentValue < previousValue ? 'down' : 'flat',
    lastUpdated: new Date().toISOString(),
    metricType,
    parentMetricId,
    format,
    comparisonMode,
    cadence,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };
}

// Base Metrics with new comparison modes and cadence
const metrics: Metric[] = [
  // Pillar 1: New Revenue & Market Expansion
  createMetric('bbbb1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'Pipeline Value', 'Total value of active sales pipeline',
    2500000, 2400000, 2200000, 'key_result', 'currency', 'hubspot', 'at_or_above', 'monthly'),
  createMetric('bbbb1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'New Customers', 'Number of new customers acquired this quarter',
    15, 12, 10, 'key_result', 'number', 'hubspot', 'on_track', 'quarterly'),
  createMetric('bbbb1113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'Win Rate', 'Percentage of opportunities won',
    35, 32, 31, 'key_result', 'percentage', 'hubspot', 'at_or_above', 'monthly'),

  // Pillar 2: Customer Value & Expansion
  createMetric('bbbb2221-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
    'Net Revenue Retention', 'Revenue retention including expansions',
    120, 115, 112, 'key_result', 'percentage', 'manual', 'at_or_above', 'monthly'),
  createMetric('bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
    'Expansion Revenue', 'Revenue from existing customer expansions',
    500000, 420000, 380000, 'key_result', 'currency', 'hubspot', 'on_track', 'quarterly'),
  createMetric('bbbb2223-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
    'Customer Upsells', 'Number of successful upsell deals',
    20, 14, 12, 'key_result', 'number', 'hubspot', 'on_track', 'quarterly'),

  // Pillar 3: Retention & Customer Success
  createMetric('bbbb3331-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
    'Customer Retention Rate', 'Percentage of customers retained',
    95, 93, 92, 'key_result', 'percentage', 'manual', 'at_or_above', 'monthly'),
  createMetric('bbbb3332-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
    'NPS Score', 'Net Promoter Score',
    50, 47, 45, 'key_result', 'number', 'manual', 'at_or_above', 'quarterly'),
  createMetric('bbbb3333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
    'Support Response Time', 'Average first response time in hours (lower is better)',
    2, 2.5, 3, 'key_result', 'number', 'manual', 'at_or_below', 'weekly'),

  // Pillar 4: Operational Excellence
  createMetric('bbbb4441-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
    'Sprint Velocity', 'Average story points completed per sprint',
    50, 42, 38, 'key_result', 'number', 'jira', 'at_or_above', 'weekly'),
  createMetric('bbbb4442-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
    'Bug Resolution Time', 'Average days to resolve bugs (lower is better)',
    3, 4.2, 5, 'key_result', 'number', 'jira', 'at_or_below', 'weekly'),
  createMetric('bbbb4443-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444',
    'Deployment Frequency', 'Deployments per week',
    10, 8, 6, 'key_result', 'number', 'jira', 'at_or_above', 'weekly'),

  // Leading Indicators for Pipeline Value
  createMetric('cccc1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'MQLs Generated', 'Marketing qualified leads this month',
    200, 185, 170, 'leading_indicator', 'number', 'hubspot', 'on_track', 'monthly',
    'bbbb1111-1111-1111-1111-111111111111'),
  createMetric('cccc1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'Demo Requests', 'Number of demo requests',
    40, 35, 30, 'leading_indicator', 'number', 'hubspot', 'on_track', 'monthly',
    'bbbb1111-1111-1111-1111-111111111111'),
  createMetric('cccc1113-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'Outbound Meetings', 'Outbound meetings booked',
    60, 48, 45, 'leading_indicator', 'number', 'hubspot', 'on_track', 'monthly',
    'bbbb1111-1111-1111-1111-111111111111'),

  // Quality Metrics
  createMetric('dddd1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'Lead Quality Score', 'Average lead score',
    80, 72, 68, 'quality', 'percentage', 'hubspot', 'at_or_above', 'monthly',
    'bbbb1111-1111-1111-1111-111111111111'),
  createMetric('dddd1112-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
    'Time to First Contact', 'Hours to first sales contact (lower is better)',
    2, 2.3, 3.1, 'quality', 'number', 'hubspot', 'at_or_below', 'weekly',
    'bbbb1111-1111-1111-1111-111111111111'),
];

// Metric owners mapping
const metricOwners: { metricId: string; executiveId: string }[] = [
  { metricId: 'bbbb1111-1111-1111-1111-111111111111', executiveId: 'aaaa4444-4444-4444-4444-444444444444' },
  { metricId: 'bbbb1112-1111-1111-1111-111111111111', executiveId: 'aaaa4444-4444-4444-4444-444444444444' },
  { metricId: 'bbbb1112-1111-1111-1111-111111111111', executiveId: 'aaaa3333-3333-3333-3333-333333333333' },
  { metricId: 'bbbb1113-1111-1111-1111-111111111111', executiveId: 'aaaa4444-4444-4444-4444-444444444444' },
  { metricId: 'bbbb2221-2222-2222-2222-222222222222', executiveId: 'aaaa2222-2222-2222-2222-222222222222' },
  { metricId: 'bbbb2221-2222-2222-2222-222222222222', executiveId: 'aaaa4444-4444-4444-4444-444444444444' },
  { metricId: 'bbbb2222-2222-2222-2222-222222222222', executiveId: 'aaaa4444-4444-4444-4444-444444444444' },
  { metricId: 'bbbb2223-2222-2222-2222-222222222222', executiveId: 'aaaa4444-4444-4444-4444-444444444444' },
  { metricId: 'bbbb3331-3333-3333-3333-333333333333', executiveId: 'aaaa6666-6666-6666-6666-666666666666' },
  { metricId: 'bbbb3332-3333-3333-3333-333333333333', executiveId: 'aaaa6666-6666-6666-6666-666666666666' },
  { metricId: 'bbbb3333-3333-3333-3333-333333333333', executiveId: 'aaaa5555-5555-5555-5555-555555555555' },
  { metricId: 'bbbb4441-4444-4444-4444-444444444444', executiveId: 'aaaa5555-5555-5555-5555-555555555555' },
  { metricId: 'bbbb4442-4444-4444-4444-444444444444', executiveId: 'aaaa5555-5555-5555-5555-555555555555' },
  { metricId: 'bbbb4443-4444-4444-4444-444444444444', executiveId: 'aaaa5555-5555-5555-5555-555555555555' },
];

// Commitments
const commitments: Commitment[] = [
  {
    id: 'eeee1111-1111-1111-1111-111111111111',
    executiveId: 'aaaa4444-4444-4444-4444-444444444444',
    metricId: 'bbbb1113-1111-1111-1111-111111111111',
    title: 'Implement new sales methodology',
    description: 'Roll out MEDDIC sales methodology to improve win rate',
    status: 'in_progress',
    targetDate: '2025-02-15',
    createdAt: '2025-01-05T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'eeee2222-2222-2222-2222-222222222222',
    executiveId: 'aaaa3333-3333-3333-3333-333333333333',
    metricId: 'bbbb1112-1111-1111-1111-111111111111',
    title: 'Launch Q1 demand gen campaign',
    description: 'Execute integrated marketing campaign targeting financial institutions',
    status: 'in_progress',
    targetDate: '2025-02-01',
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
  {
    id: 'eeee3333-3333-3333-3333-333333333333',
    executiveId: 'aaaa5555-5555-5555-5555-555555555555',
    metricId: 'bbbb4441-4444-4444-4444-444444444444',
    title: 'Reduce technical debt',
    description: 'Dedicate 20% of sprint capacity to technical debt reduction',
    status: 'pending',
    targetDate: '2025-03-01',
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-08T00:00:00Z',
  },
  {
    id: 'eeee4444-4444-4444-4444-444444444444',
    executiveId: 'aaaa6666-6666-6666-6666-666666666666',
    metricId: 'bbbb3332-3333-3333-3333-333333333333',
    title: 'Customer feedback program',
    description: 'Implement systematic customer feedback collection',
    status: 'in_progress',
    targetDate: '2025-02-28',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-09T00:00:00Z',
  },
];

// Commitment Updates
const commitmentUpdates: CommitmentUpdate[] = [
  {
    id: 'ffff1111-1111-1111-1111-111111111111',
    commitmentId: 'eeee1111-1111-1111-1111-111111111111',
    executiveId: 'aaaa4444-4444-4444-4444-444444444444',
    content: 'Completed training sessions for the sales team. Moving to implementation phase.',
    createdAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'ffff1112-1111-1111-1111-111111111112',
    commitmentId: 'eeee1111-1111-1111-1111-111111111111',
    executiveId: 'aaaa1111-1111-1111-1111-111111111111',
    content: 'Good progress. How are we tracking adoption rates?',
    createdAt: '2025-01-11T00:00:00Z',
  },
  {
    id: 'ffff2222-2222-2222-2222-222222222222',
    commitmentId: 'eeee2222-2222-2222-2222-222222222222',
    executiveId: 'aaaa3333-3333-3333-3333-333333333333',
    content: 'Campaign assets finalized. Launching email sequence next week.',
    createdAt: '2025-01-08T00:00:00Z',
  },
];

// Narratives
const narratives: Narrative[] = [
  {
    id: 'gggg1111-1111-1111-1111-111111111111',
    metricId: 'bbbb1113-1111-1111-1111-111111111111',
    executiveId: 'aaaa4444-4444-4444-4444-444444444444',
    content: 'Win rate has been improving due to better qualification in early stages. The new MEDDIC methodology is helping identify deal risks earlier. We expect to hit target by end of February.',
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-01-10T00:00:00Z',
  },
  {
    id: 'gggg2222-2222-2222-2222-222222222222',
    metricId: 'bbbb4441-4444-4444-4444-444444444444',
    executiveId: 'aaaa5555-5555-5555-5555-555555555555',
    content: 'Velocity has been impacted by unplanned work from production issues. Implementing better monitoring to reduce interrupt-driven work. Also starting technical debt reduction initiative.',
    createdAt: '2025-01-09T00:00:00Z',
    updatedAt: '2025-01-09T00:00:00Z',
  },
];

// Executive Reports
const executiveReports: { executiveId: string; content: string; weekOf: string }[] = [
  {
    executiveId: 'aaaa1111-1111-1111-1111-111111111111',
    content: `This week marked solid progress across our strategic initiatives, though we continue to navigate some headwinds in the operational efficiency pillar. Our pipeline growth has been exceptional, with the sales team closing two mid-market deals ahead of schedule and moving three enterprise opportunities into late-stage negotiations.

I'm particularly pleased with the cross-functional collaboration between Sales and Customer Success on the new onboarding framework. Early indicators suggest this will significantly improve our time-to-value metrics. The executive team met on Wednesday to review Q1 progress, and we're on track for 92% of our quarterly targets.

Key priorities for next week include finalizing the enterprise deal with Acme Corp, launching our revamped customer health scoring system, and addressing the engineering velocity concerns that Brian will elaborate on in his update. I've asked the leadership team to come prepared to our Monday standup with specific action plans for any metrics currently in the yellow zone.`,
    weekOf: getCurrentWeekOf(),
  },
  {
    executiveId: 'aaaa4444-4444-4444-4444-444444444444',
    content: `Revenue performance this week exceeded expectations, with the sales organization delivering strong results across both new business and expansion motions. We closed $340K in new ARR, bringing our Q1 total to $1.2M against a target of $1.5M. With six weeks remaining, I'm confident we'll hit our number.

The enterprise segment continues to be our growth engine. The Acme Corp deal ($180K ARR) is in final contract review, and we expect signatures by end of next week. Additionally, our expansion pipeline has grown 23% month-over-month, driven by strong product adoption within our customer base. The new account executive onboarding program is showing results—our January hires are already at 70% of quota, well ahead of the typical ramp timeline.

Areas requiring attention include our SMB conversion rates, which dropped 8% this month. I'm working with Kevin to analyze whether this is a lead quality issue or a sales process gap. We'll have a diagnosis and action plan by our next leadership meeting.`,
    weekOf: getCurrentWeekOf(),
  },
  {
    executiveId: 'aaaa3333-3333-3333-3333-333333333333',
    content: `Marketing delivered a strong week with our Q1 demand generation campaign going live on Monday. Early performance indicators are encouraging—we're seeing a 34% open rate on our email sequences (up from 28% benchmark) and website traffic has increased 45% week-over-week. The new product positioning we tested in January is clearly resonating with our target audience.

Content production is on track with three new case studies published and our thought leadership webinar series scheduled through March. Our partnership with the industry analyst firm has resulted in positive coverage that's driving inbound inquiries from enterprise prospects.

The primary challenge remains lead quality in the SMB segment. I've implemented new scoring criteria and am working closely with Aaron's team to tighten our ideal customer profile definition. We're also piloting an ABM approach for our top 50 enterprise targets, with early results showing 3x engagement rates compared to our standard outbound motion. Next week, I'll be presenting the full Q1 campaign results and Q2 planning recommendations to the executive team.`,
    weekOf: getCurrentWeekOf(),
  },
  {
    executiveId: 'aaaa5555-5555-5555-5555-555555555555',
    content: `Engineering made progress on several fronts this week, though our velocity metrics remain below where we'd like them to be. We shipped the new dashboard analytics feature on schedule, which has received positive feedback from beta customers. The platform stability improvements deployed last sprint have reduced our p95 latency by 28% and eliminated the intermittent timeout issues that were impacting customer experience.

The velocity gap is primarily driven by two factors: increased support escalations from the recent customer growth and accumulated technical debt in our authentication module. I've reallocated two senior engineers to a focused tech debt reduction initiative, targeting a 40% improvement in that module's maintainability score by end of Q1.

On the positive side, our new monitoring and alerting infrastructure is fully operational, reducing our mean time to detection from 12 minutes to under 2 minutes. This proactive approach has already prevented two potential customer-impacting incidents. Next week, we're kicking off the API v2 project which will be critical for our enterprise customer requirements and integration partnerships.`,
    weekOf: getCurrentWeekOf(),
  },
  {
    executiveId: 'aaaa6666-6666-6666-6666-666666666666',
    content: `Product had a productive week focused on customer discovery and roadmap refinement. We completed 8 customer interviews as part of our Jobs-to-Be-Done research, and the insights are reshaping our Q2 priorities. Customers are consistently asking for deeper analytics capabilities and more flexible workflow automation—both areas we've been exploring but now have stronger validation to prioritize.

Our NPS tracking automation went live on Tuesday, and we're already seeing a 40% increase in survey response rates compared to our previous manual process. Current NPS stands at 42, up from 38 last quarter, with enterprise customers rating us at 52. The new customer health scoring model is in final testing and will roll out next week, giving Customer Success much better leading indicators for churn risk.

The feature request backlog review I conducted with Brian identified three quick wins that can be delivered in the next sprint without impacting our core roadmap. These small improvements will address pain points mentioned in 60% of recent support tickets. I'm also finalizing the competitive analysis refresh, which will inform our positioning updates for the April product launch.`,
    weekOf: getCurrentWeekOf(),
  },
  {
    executiveId: 'aaaa2222-2222-2222-2222-222222222222',
    content: `Finance completed several key initiatives this week that strengthen our operational foundation. We closed the books on January ahead of schedule, with revenue recognition accuracy at 99.7%. Cash collections improved significantly—DSO dropped from 42 days to 36 days, reflecting the new automated invoicing system we implemented last month.

The Q1 forecast has been updated based on pipeline and bookings data through last week. We're projecting to finish the quarter at 104% of revenue target, assuming the enterprise deals in late stage close as expected. I've worked with Aaron to stress-test these assumptions and we have contingency scenarios documented.

On the operational efficiency front, we've identified $180K in annual cost savings through vendor consolidation and process automation. These savings will offset the incremental headcount investments planned for Q2. The board materials for next month's meeting are 80% complete, and I'll be presenting a detailed unit economics analysis that shows continued improvement in our LTV:CAC ratio. Next week's priorities include finalizing the updated financial model and completing the annual compensation benchmarking study.`,
    weekOf: getCurrentWeekOf(),
  },
  {
    executiveId: 'aaaa7777-7777-7777-7777-777777777777',
    content: `Strategy and Operations focused this week on synthesizing cross-functional performance data and identifying optimization opportunities. The executive dashboard we've been building is now tracking all four strategic pillars in real-time, giving leadership unprecedented visibility into company health.

The strategic planning offsite scheduled for next month is fully planned. We'll be reviewing our three-year vision, validating market assumptions, and pressure-testing our go-to-market strategy against emerging competitive dynamics. I've prepared pre-read materials that include a comprehensive market landscape analysis and customer segmentation refresh.

My analysis of our operational metrics revealed an interesting correlation: teams that have adopted our new goal-setting framework are showing 25% better metric performance than those still using legacy processes. I'm documenting this as a best practice and will be rolling out training sessions next quarter. Additionally, the partnership pipeline review with Aaron identified two strategic alliance opportunities that could accelerate our enterprise market penetration. I'll be presenting initial term sheet recommendations at next week's leadership meeting.`,
    weekOf: getCurrentWeekOf(),
  },
];

// Helper functions
function generateMetricHistory(metricId: string, currentValue: number): MetricHistory[] {
  const history: MetricHistory[] = [];
  let value = currentValue * 0.85;

  for (let i = 11; i >= 0; i--) {
    const date = subDays(new Date(), i * 7);
    value = value + (currentValue - value) * 0.15 + (Math.random() - 0.5) * currentValue * 0.05;
    history.push({
      id: `hist-${metricId}-${i}`,
      metricId,
      value: Math.round(value * 100) / 100,
      recordedAt: date.toISOString(),
    });
  }

  return history;
}

function getMetricWithDetails(metric: Metric): MetricWithDetails {
  const owners = metricOwners
    .filter((mo) => mo.metricId === metric.id)
    .map((mo) => executives.find((e) => e.id === mo.executiveId)!)
    .filter(Boolean);

  const childMetrics = metrics
    .filter((m) => m.parentMetricId === metric.id)
    .map((m) => getMetricWithDetails(m));

  const metricNarratives = narratives.filter((n) => n.metricId === metric.id);
  const metricCommitments = commitments
    .filter((c) => c.metricId === metric.id)
    .map((c) => ({
      ...c,
      metric,
      updates: commitmentUpdates
        .filter((u) => u.commitmentId === c.id)
        .map((u) => ({
          ...u,
          executive: executives.find((e) => e.id === u.executiveId),
        })),
    }));

  return {
    ...metric,
    status: getMetricStatus(metric.currentValue, metric.targetValue, { green: 90, yellow: 70 }, metric.comparisonMode),
    percentageOfTarget: getPercentageOfTarget(metric.currentValue, metric.targetValue),
    owners,
    childMetrics: childMetrics.length > 0 ? childMetrics : undefined,
    narratives: metricNarratives,
    commitments: metricCommitments,
    history: generateMetricHistory(metric.id, metric.currentValue),
  };
}

function getPillarWithScore(pillar: Pillar): PillarWithScore {
  const pillarMetrics = metrics
    .filter((m) => m.pillarId === pillar.id && m.metricType === 'key_result')
    .map((m) => getMetricWithDetails(m));

  const score = getPillarScore(pillarMetrics);
  const status = calculatePillarStatus(score, pillar.colorThresholds);

  return {
    ...pillar,
    score,
    status,
    metrics: pillarMetrics,
  };
}

function getExecutiveWithDetails(executive: Executive): ExecutiveWithDetails {
  const ownedMetricIds = metricOwners
    .filter((mo) => mo.executiveId === executive.id)
    .map((mo) => mo.metricId);

  const ownedMetrics = metrics
    .filter((m) => ownedMetricIds.includes(m.id))
    .map((m) => getMetricWithDetails(m));

  const execCommitments = commitments
    .filter((c) => c.executiveId === executive.id)
    .map((c) => {
      const metric = metrics.find((m) => m.id === c.metricId)!;
      return {
        ...c,
        metric,
        updates: commitmentUpdates
          .filter((u) => u.commitmentId === c.id)
          .map((u) => ({
            ...u,
            executive: executives.find((e) => e.id === u.executiveId),
          })),
      };
    });

  const report = executiveReports.find((r) => r.executiveId === executive.id);

  const improvedMetrics = ownedMetrics
    .filter((m) => m.status === 'green' && m.previousValue && m.currentValue > m.previousValue)
    .slice(0, 2);

  return {
    ...executive,
    ownedMetrics,
    commitments: execCommitments,
    improvedMetrics,
    report: report
      ? {
          id: `report-${executive.id}`,
          executiveId: executive.id,
          content: report.content,
          weekOf: report.weekOf,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : undefined,
  };
}

function generateOverviewSummary(pillarsWithScores: PillarWithScore[]): OverviewSummary {
  const overallScore = Math.round(
    pillarsWithScores.reduce((sum, p) => sum + p.score, 0) / pillarsWithScores.length
  );

  const overallStatus = overallScore >= 90 ? 'green' : overallScore >= 70 ? 'yellow' : 'red';

  const pillarsOnTrack = pillarsWithScores.filter((p) => p.status === 'green').length;
  const pillarsAtRisk = pillarsWithScores.filter((p) => p.status === 'yellow').length;
  const pillarsOffTrack = pillarsWithScores.filter((p) => p.status === 'red').length;

  const allMetrics = pillarsWithScores.flatMap((p) => p.metrics);
  const metricsImproved = allMetrics.filter((m) => m.trendDirection === 'up').length;
  const metricsDeclined = allMetrics.filter((m) => m.trendDirection === 'down').length;

  const activeCommitments = commitments.filter(
    (c) => c.status === 'in_progress' || c.status === 'pending'
  ).length;

  // Generate highlights and concerns
  const highlights: string[] = [];
  const concerns: string[] = [];

  // Check each pillar for highlights/concerns
  pillarsWithScores.forEach((pillar) => {
    if (pillar.status === 'green') {
      highlights.push(`${pillar.name} is performing above expectations at ${pillar.score}%`);
    } else if (pillar.status === 'red') {
      concerns.push(`${pillar.name} needs attention - currently at ${pillar.score}%`);
    }
  });

  // Check individual metrics
  allMetrics.forEach((metric) => {
    if (metric.percentageOfTarget >= 100) {
      highlights.push(`${metric.name} has exceeded target`);
    }
    if (metric.status === 'red' && metric.trendDirection === 'down') {
      concerns.push(`${metric.name} is declining and below target`);
    }
  });

  // Generate detailed narrative
  let narrative = '';
  const totalPillars = pillarsWithScores.length;
  const greenPillarNames = pillarsWithScores.filter(p => p.status === 'green').map(p => p.name);
  const yellowPillarNames = pillarsWithScores.filter(p => p.status === 'yellow').map(p => p.name);
  const redPillarNames = pillarsWithScores.filter(p => p.status === 'red').map(p => p.name);

  if (overallStatus === 'green') {
    narrative = `This week reflects strong execution across the organization, with Hapax achieving an overall performance score of ${overallScore}%. ${pillarsOnTrack} of our ${totalPillars} strategic pillars are performing at or above target, demonstrating the team's commitment to our quarterly objectives. ${greenPillarNames.length > 0 ? `${greenPillarNames.join(' and ')} ${greenPillarNames.length === 1 ? 'is' : 'are'} leading the way with exceptional results.` : ''}

Looking at the underlying metrics, we're seeing positive momentum with ${metricsImproved} metrics trending upward week-over-week. This improvement is driven by focused execution on our key initiatives and strong cross-functional collaboration. The leadership team has ${activeCommitments} active commitments in flight to sustain this performance and address any emerging opportunities.

${yellowPillarNames.length > 0 ? `While overall performance is strong, ${yellowPillarNames.join(' and ')} ${yellowPillarNames.length === 1 ? 'requires' : 'require'} continued attention to maintain momentum and avoid slipping into at-risk territory. ` : ''}The executive team is aligned on priorities for the coming week, with clear ownership and accountability across all strategic initiatives.`;
  } else if (overallStatus === 'yellow') {
    narrative = `This week's performance reflects mixed results across the organization, with an overall score of ${overallScore}%. While we're seeing strength in certain areas, ${pillarsAtRisk + pillarsOffTrack} of our ${totalPillars} strategic pillars require focused attention to get back on track. ${yellowPillarNames.length > 0 ? `${yellowPillarNames.join(' and ')} ${yellowPillarNames.length === 1 ? 'is' : 'are'} in the at-risk zone and ${yellowPillarNames.length === 1 ? 'needs' : 'need'} immediate intervention.` : ''}

Analyzing the metric trends, ${metricsImproved} metrics are showing improvement while ${metricsDeclined} are declining. This mixed picture underscores the need for prioritization and resource allocation to the areas with the greatest impact on our quarterly goals. ${greenPillarNames.length > 0 ? `${greenPillarNames.join(' and ')} ${greenPillarNames.length === 1 ? 'continues' : 'continue'} to perform well, providing a foundation we can build on.` : ''}

The leadership team has ${activeCommitments} active commitments in place to address the key challenges. Each executive has been asked to present specific action plans in the weekly standup, with clear milestones and success criteria. Our focus for the coming week is on execution discipline and removing blockers that are impeding progress on critical initiatives.`;
  } else {
    narrative = `This week has been challenging, with an overall performance score of ${overallScore}% indicating we are significantly behind on our strategic objectives. ${pillarsOffTrack} of our ${totalPillars} pillars are off track, requiring immediate intervention and executive attention. ${redPillarNames.length > 0 ? `${redPillarNames.join(' and ')} ${redPillarNames.length === 1 ? 'is' : 'are'} the primary ${redPillarNames.length === 1 ? 'area' : 'areas'} of concern.` : ''}

The metric analysis reveals ${metricsDeclined} declining metrics against ${metricsImproved} improving, a ratio that demands urgent action. While some bright spots exist, the overall trajectory is not aligned with our quarterly targets. Root cause analysis is underway to understand the systemic issues driving underperformance.

The executive team is mobilizing with ${activeCommitments} active commitments to reverse these trends. An emergency review session has been scheduled to reprioritize resources and remove obstacles. ${greenPillarNames.length > 0 ? `We'll be protecting the momentum in ${greenPillarNames.join(' and ')} while redirecting energy to the underperforming areas. ` : ''}Clear accountability and daily progress tracking will be implemented until we see sustained improvement.`;
  }

  return {
    overallScore,
    overallStatus,
    narrative,
    highlights: highlights.slice(0, 3),
    concerns: concerns.slice(0, 3),
    weekOverWeekChange: 3, // Mock value
    pillarsOnTrack,
    pillarsAtRisk,
    pillarsOffTrack,
    activeCommitments,
    metricsImproved,
    metricsDeclined,
  };
}

// Talking Items for meetings
const talkingItems: TalkingItem[] = [
  {
    id: 'talk-001',
    title: 'Q2 Hiring Plan Review',
    description: 'We need to discuss the updated headcount plan for Q2 and align on priority roles. Engineering is requesting two additional senior engineers, and Sales wants to expand the SDR team.',
    addedBy: 'aaaa1111-1111-1111-1111-111111111111',
    addedByName: 'Hank Seale',
    priority: 'high',
    status: 'open',
    weekOf: getCurrentWeekOf(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'talk-002',
    title: 'SMB Conversion Rate Decline',
    description: 'Our SMB conversion rates dropped 8% this month. Need to diagnose whether this is a lead quality issue or sales process gap.',
    addedBy: 'aaaa4444-4444-4444-4444-444444444444',
    addedByName: 'Aaron Kwan',
    priority: 'high',
    status: 'open',
    relatedPillarId: '11111111-1111-1111-1111-111111111111',
    weekOf: getCurrentWeekOf(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'talk-003',
    title: 'Engineering Velocity Initiative',
    description: 'Brian to present the technical debt reduction plan and timeline for getting velocity back on track.',
    addedBy: 'aaaa5555-5555-5555-5555-555555555555',
    addedByName: 'Brian Huddleston',
    priority: 'medium',
    status: 'open',
    relatedPillarId: '44444444-4444-4444-4444-444444444444',
    weekOf: getCurrentWeekOf(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'talk-004',
    title: 'Strategic Partnership Update',
    description: 'Review the two partnership opportunities identified last week and decide on next steps.',
    addedBy: 'aaaa7777-7777-7777-7777-777777777777',
    addedByName: 'Connor Huddleston',
    priority: 'medium',
    status: 'open',
    weekOf: getCurrentWeekOf(),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'talk-005',
    title: 'Board Meeting Prep',
    description: 'Quick sync on key messages and any concerns before the board meeting next month.',
    addedBy: 'aaaa2222-2222-2222-2222-222222222222',
    addedByName: 'Jennifer Harris',
    priority: 'low',
    status: 'deferred',
    weekOf: getCurrentWeekOf(),
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Sample Meeting Notes for past weeks (Gemini-generated)
function generateMeetingNotes(weekOf: string): MeetingNotes {
  return {
    id: `notes-${weekOf}`,
    weekOf,
    generatedAt: new Date(new Date(weekOf).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Friday of that week
    content: `Executive Leadership Meeting Summary

The executive team convened for the weekly leadership meeting to review company performance across all four strategic pillars. All seven executives were in attendance: Hank Seale (CEO), Jennifer Harris (CFO), Kevin Green (CMO), Aaron Kwan (CRO), Brian Huddleston (CTO), Greg Varnell (CPO), and Connor Huddleston (CSO).

The meeting opened with Hank providing an overview of the week's performance, noting that while overall metrics remain strong, there are specific areas requiring focused attention. The team reviewed the dashboard showing an overall score of 82%, with three pillars on track and one requiring intervention.

Q1 Revenue Progress

Aaron presented the current pipeline status and Q1 forecast. The team is at 80% of the quarterly target with six weeks remaining. The enterprise segment continues to outperform expectations, driven by two large deals moving into late-stage negotiations. However, SMB conversion rates have declined 8% month-over-month, which Aaron flagged as a concern requiring immediate diagnosis. Kevin committed to working with Aaron's team to determine whether the decline is attributable to lead quality issues or sales process gaps. The team agreed to focus resources on enterprise deals while investigating the SMB decline.

Engineering Velocity Discussion

Brian outlined the factors impacting sprint velocity, including increased production support load following recent customer growth and accumulated technical debt in the authentication module. He proposed a dedicated technical debt initiative, allocating 20% of sprint capacity to address the most critical areas. After discussion, the team approved this allocation, with Brian committing to present a detailed roadmap at next week's meeting. The monitoring infrastructure improvements deployed last sprint have already shown positive results, reducing mean time to detection from 12 minutes to under 2 minutes.

Q2 Hiring Plan

Jennifer presented the updated headcount plan for Q2. Engineering requested two additional senior engineers to support the technical debt initiative and upcoming API v2 project. Sales requested expansion of the SDR team to support the ABM initiative. Given budget constraints, the team discussed prioritization. The decision was made to approve the engineering hires immediately, as they are critical for product velocity, while deferring the Sales SDR expansion to Q3 pending achievement of Q1 revenue targets.

Customer Health Scoring Launch

Greg demoed the new customer health scoring system, which has been in beta testing for three weeks. Early results show strong correlation with churn prediction, with the model identifying at-risk accounts an average of 45 days before traditional indicators. The team approved moving to production deployment, with the Customer Success team to be trained by end of week. This capability is expected to significantly improve the Retention & Customer Success pillar metrics.

Strategic Partnerships

Connor reviewed two partnership opportunities identified through recent market analysis. Both opportunities could accelerate enterprise market penetration and provide valuable integration capabilities. The team agreed these warrant further exploration, with Connor tasked to develop term sheet recommendations for review at the next leadership meeting.

Key Decisions Made

1. Approved Q2 hiring plan with modifications - Engineering receives 2 senior engineers, Sales SDR expansion deferred to Q3
2. Authorized 20% sprint capacity allocation for technical debt reduction starting next sprint
3. Decided to implement ABM approach for top 50 enterprise accounts as primary outbound strategy
4. Approved $50K budget for enhanced monitoring and observability tooling
5. Approved customer health scoring system for production deployment

Action Items

- Aaron: Complete root cause analysis on SMB conversion rate decline (due next week)
- Brian: Present technical debt reduction roadmap to leadership (due in two weeks)
- Connor: Finalize partnership term sheet recommendations (due in 10 days)
- Greg: Schedule customer advisory board for product feedback (due in three weeks)
- Jennifer: Complete board materials draft for review (due in two weeks)

Next Steps

The team will reconvene next week to review progress on action items. Engineering will begin the tech debt sprint with a focus on the authentication module. Sales will implement the enterprise-focused ABM strategy. Product will deploy the customer health scoring system to production. Finance will finalize board materials for the upcoming board meeting. Connor will present partnership recommendations at the next leadership meeting.

Meeting adjourned at 11:45 AM.`,
  };
}

// Helper to generate metrics to review (at-risk metrics)
function generateMetricsToReview(pillarsWithScores: PillarWithScore[]): MetricReviewItem[] {
  const reviewItems: MetricReviewItem[] = [];

  pillarsWithScores.forEach((pillar) => {
    pillar.metrics.forEach((metric) => {
      if (metric.status === 'red' || metric.status === 'yellow') {
        reviewItems.push({
          id: `review-${metric.id}`,
          metricId: metric.id,
          metric,
          pillarId: pillar.id,
          pillarName: pillar.name,
          status: 'pending',
          weekOf: getCurrentWeekOf(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
  });

  return reviewItems;
}

// Export functions for getting data
export function getDashboardData(): DashboardData {
  const pillarsWithScores = pillars.map(getPillarWithScore);

  return {
    pillars: pillarsWithScores,
    executives: executives.map(getExecutiveWithDetails),
    overview: generateOverviewSummary(pillarsWithScores),
    lastRefreshed: new Date().toISOString(),
  };
}

export function getDashboardDataExtended(): DashboardDataExtended {
  const pillarsWithScores = pillars.map(getPillarWithScore);

  return {
    pillars: pillarsWithScores,
    executives: executives.map(getExecutiveWithDetails),
    overview: generateOverviewSummary(pillarsWithScores),
    lastRefreshed: new Date().toISOString(),
    talkingItems: [...talkingItems],
    metricsToReview: generateMetricsToReview(pillarsWithScores),
  };
}

export function getTalkingItems(): TalkingItem[] {
  return [...talkingItems];
}

export function getPillarById(id: string): PillarWithScore | null {
  const pillar = pillars.find((p) => p.id === id);
  if (!pillar) return null;

  const pillarWithScore = getPillarWithScore(pillar);

  const allMetrics = metrics
    .filter((m) => m.pillarId === id)
    .map((m) => getMetricWithDetails(m));

  return {
    ...pillarWithScore,
    metrics: allMetrics,
  };
}

export function getMetricById(id: string): MetricWithDetails | null {
  const metric = metrics.find((m) => m.id === id);
  if (!metric) return null;
  return getMetricWithDetails(metric);
}

export function getExecutives(): Executive[] {
  return executives;
}

export function getExecutiveById(id: string): ExecutiveWithDetails | null {
  const executive = executives.find((e) => e.id === id);
  if (!executive) return null;
  return getExecutiveWithDetails(executive);
}

export function getMeetingNotes(weekOf: string): MeetingNotes | null {
  // Only return meeting notes for past weeks
  const currentWeek = getCurrentWeekOf();
  if (weekOf >= currentWeek) {
    return null; // No meeting notes for current or future weeks
  }
  return generateMeetingNotes(weekOf);
}

export function getDashboardDataForWeek(weekOf: string): DashboardDataExtended {
  const pillarsWithScores = pillars.map(getPillarWithScore);
  const currentWeek = getCurrentWeekOf();
  const isPastWeek = weekOf < currentWeek;

  return {
    pillars: pillarsWithScores,
    executives: executives.map(getExecutiveWithDetails),
    overview: generateOverviewSummary(pillarsWithScores),
    lastRefreshed: new Date().toISOString(),
    talkingItems: [...talkingItems].filter((t) => t.weekOf === weekOf || t.weekOf === currentWeek),
    metricsToReview: generateMetricsToReview(pillarsWithScores),
    meetingNotes: isPastWeek ? generateMeetingNotes(weekOf) : undefined,
  };
}
