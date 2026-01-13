export type MetricStatus = 'green' | 'yellow' | 'red';
export type MetricType = 'key_result' | 'leading_indicator' | 'quality';
export type TrendDirection = 'up' | 'down' | 'flat';
export type CommitmentStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type DataSource = 'hubspot' | 'jira' | 'sheets' | 'manual';
export type TimePeriod = 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type ReviewType = 'weekly' | 'monthly' | 'quarterly' | 'annual';

// How to compare a metric against its target
export type ComparisonMode =
  | 'on_track'      // Cumulative progress toward end-of-period goal (e.g., "15 new customers by EOQ")
  | 'at_or_above'   // Must stay at or above target (e.g., "95% retention rate")
  | 'at_or_below'   // Must stay at or below target (e.g., "< 3 day bug resolution time")
  | 'exact';        // Should be exactly at target (rare, usually for specific SLAs)

export interface Thresholds {
  green: number;  // percentage at or above = green
  yellow: number; // percentage at or above = yellow
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
  colorThresholds: Thresholds;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PillarWithScore extends Pillar {
  score: number;
  status: MetricStatus;
  metrics: MetricWithDetails[];
}

export interface PeriodTarget {
  target: number;
  warningThreshold?: number;  // percentage where it turns yellow
  criticalThreshold?: number; // percentage where it turns red
}

export interface MetricTargets {
  weekly?: PeriodTarget;
  monthly?: PeriodTarget;
  quarterly?: PeriodTarget;
  annual?: PeriodTarget;
}

export interface MetricValues {
  weekly?: number;
  monthly?: number;
  quarterly?: number;
  annual?: number;
}

export interface Metric {
  id: string;
  pillarId: string;
  name: string;
  description: string;
  dataSource: DataSource;
  apiConfig: Record<string, unknown>;
  targetValue: number;
  targets?: MetricTargets; // Multi-period targets
  currentValue: number;
  periodValues?: MetricValues; // Aggregated values for each period
  warningThreshold: number;
  criticalThreshold: number;
  previousValue?: number;
  trendDirection: TrendDirection;
  lastUpdated: string;
  metricType: MetricType;
  parentMetricId?: string;
  unit?: string;
  format?: 'number' | 'currency' | 'percentage';
  aggregationType?: 'sum' | 'average' | 'latest'; // How to roll up values
  comparisonMode: ComparisonMode; // How to evaluate this metric
  cadence: TimePeriod; // Primary tracking cadence (weekly, monthly, etc.)
  createdAt: string;
  updatedAt: string;
}

export interface MetricWithDetails extends Metric {
  status: MetricStatus;
  percentageOfTarget: number;
  owners: Executive[];
  childMetrics?: MetricWithDetails[];
  narratives: Narrative[];
  commitments: CommitmentWithMetric[];
  history: MetricHistory[];
}

export interface MetricHistory {
  id: string;
  metricId: string;
  value: number;
  recordedAt: string;
}

export interface Executive {
  id: string;
  name: string;
  title: string;
  headshotUrl: string;
  email: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutiveWithDetails extends Executive {
  report?: ExecutiveReport;
  commitments: CommitmentWithMetric[];
  ownedMetrics: MetricWithDetails[];
  improvedMetrics: MetricWithDetails[];
}

export interface ExecutiveReport {
  id: string;
  executiveId: string;
  content: string;
  weekOf: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetricOwner {
  metricId: string;
  executiveId: string;
}

export interface Commitment {
  id: string;
  executiveId: string;
  metricId: string;
  title: string;
  description: string;
  status: CommitmentStatus;
  createdAt: string;
  targetDate?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface CommitmentWithMetric extends Commitment {
  metric: Metric;
  updates: CommitmentUpdate[];
}

export interface CommitmentUpdate {
  id: string;
  commitmentId: string;
  executiveId: string;
  executive?: Executive;
  content: string;
  createdAt: string;
}

export interface Narrative {
  id: string;
  metricId: string;
  executiveId: string;
  executive?: Executive;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface OverviewSummary {
  overallScore: number;
  overallStatus: MetricStatus;
  narrative: string;
  highlights: string[];
  concerns: string[];
  weekOverWeekChange: number;
  pillarsOnTrack: number;
  pillarsAtRisk: number;
  pillarsOffTrack: number;
  activeCommitments: number;
  metricsImproved: number;
  metricsDeclined: number;
}

export interface DashboardData {
  pillars: PillarWithScore[];
  executives: ExecutiveWithDetails[];
  overview: OverviewSummary;
  lastRefreshed: string;
}

// Weekly Snapshot Types
export interface WeeklySnapshot {
  id: string;
  weekOf: string; // ISO date string for the Monday of the week
  createdAt: string;
  pillars: PillarSnapshot[];
  executives: ExecutiveSnapshot[];
}

export interface PillarSnapshot {
  id: string;
  snapshotId: string;
  pillarId: string;
  pillarName: string;
  score: number;
  status: MetricStatus;
  metrics: MetricSnapshot[];
}

export interface MetricSnapshot {
  id: string;
  pillarSnapshotId: string;
  metricId: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  status: MetricStatus;
  trendDirection: TrendDirection;
}

export interface ExecutiveSnapshot {
  id: string;
  snapshotId: string;
  executiveId: string;
  executiveName: string;
  reportContent?: string;
  commitmentsSummary: CommitmentSnapshotSummary[];
  improvedMetricIds: string[];
}

export interface CommitmentSnapshotSummary {
  commitmentId: string;
  title: string;
  status: CommitmentStatus;
  metricName: string;
  latestUpdate?: string;
}

// Integration config types
export interface HubSpotConfig {
  dealPipeline?: string;
  dateRange?: string;
  properties?: string[];
}

export interface JiraConfig {
  projectKey?: string;
  sprintId?: string;
  jql?: string;
}

export interface SheetsConfig {
  spreadsheetId?: string;
  range?: string;
  valueColumn?: string;
}

// Week navigation
export interface WeekInfo {
  weekOf: string;
  label: string;
  isCurrentWeek: boolean;
}

// Period navigation for reviews
export interface PeriodInfo {
  periodType: TimePeriod;
  startDate: string;
  endDate: string;
  label: string;
  isCurrent: boolean;
}

// Review types
export interface Review {
  id: string;
  reviewType: ReviewType;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'in_progress' | 'completed';
  pillars: PillarReviewData[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PillarReviewData {
  pillarId: string;
  pillarName: string;
  score: number;
  status: MetricStatus;
  summary?: string;
  metrics: MetricReviewData[];
}

export interface MetricReviewData {
  metricId: string;
  metricName: string;
  targetValue: number;
  actualValue: number;
  status: MetricStatus;
  percentageOfTarget: number;
  commentary?: string;
  actionItems?: string[];
}

// Talking Items for meeting discussions
export type TalkingItemPriority = 'high' | 'medium' | 'low';
export type TalkingItemStatus = 'open' | 'discussed' | 'deferred';

export interface TalkingItem {
  id: string;
  title: string;
  description?: string;
  addedBy: string; // executive id
  addedByName?: string;
  priority: TalkingItemPriority;
  status: TalkingItemStatus;
  relatedMetricId?: string;
  relatedPillarId?: string;
  weekOf: string;
  createdAt: string;
  updatedAt: string;
  discussedAt?: string;
  notes?: string; // Notes from discussion
}

// Metric Review Queue for at-risk metrics
export type MetricReviewStatus = 'pending' | 'reviewed' | 'deferred' | 'commitment_added';

export interface MetricReviewItem {
  id: string;
  metricId: string;
  metric: MetricWithDetails;
  pillarId: string;
  pillarName: string;
  status: MetricReviewStatus;
  deferredUntil?: string; // Date to review again
  deferReason?: string;
  commitmentId?: string; // If a commitment was added
  reviewedAt?: string;
  reviewedBy?: string; // executive id
  notes?: string;
  weekOf: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard tabs
export type DashboardTab = 'overview' | 'talking-items' | 'to-review' | 'meeting-notes';

// Meeting Notes from Gemini - simple text format
export interface MeetingNotes {
  id: string;
  weekOf: string;
  generatedAt: string;
  content: string; // Full text content from Gemini
}

// Executive-written overview report for a week
export interface OverviewReport {
  id: string;
  weekOf: string;
  authorId: string | null;
  authorName?: string;
  narrative: string;
  highlights: string[];
  concerns: string[];
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Extended Dashboard Data with new features
export interface DashboardDataExtended extends DashboardData {
  talkingItems: TalkingItem[];
  metricsToReview: MetricReviewItem[];
  meetingNotes?: MeetingNotes; // Only present for past weeks
  overviewReport?: OverviewReport; // Executive-written overview if available
}
