import { createClient } from './client';
import {
  Pillar,
  PillarWithScore,
  Executive,
  ExecutiveWithDetails,
  Metric,
  MetricWithDetails,
  Commitment,
  CommitmentUpdate,
  Narrative,
  MetricHistory,
  DashboardData,
  DashboardDataExtended,
  OverviewSummary,
  TalkingItem,
  MetricReviewItem,
  MeetingNotes,
  OverviewReport,
} from '@/types';
import { getMetricStatus, getPercentageOfTarget, getPillarScore, calculatePillarStatus } from '@/lib/utils/scoring';
import { getCurrentWeekOf } from '@/lib/utils/formatting';

// Debug logging helper
const DEBUG = true;
const log = (message: string, data?: any) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[Supabase ${timestamp}] ${message}`, data !== undefined ? data : '');
  }
};

// ============ PILLARS ============

export async function getPillars(): Promise<Pillar[]> {
  log('getPillars: Starting...');
  const startTime = Date.now();
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pillars')
    .select('*')
    .order('sort_order');

  if (error) {
    log('getPillars: ERROR', error.message);
    throw error;
  }

  log(`getPillars: Found ${data.length} pillars in ${Date.now() - startTime}ms`);

  return data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    colorThresholds: p.color_thresholds,
    sortOrder: p.sort_order,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}

export async function getPillarById(id: string): Promise<PillarWithScore | null> {
  const supabase = createClient();

  const { data: pillar, error } = await supabase
    .from('pillars')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !pillar) return null;

  const metrics = await getMetricsByPillarId(id);
  const keyResultMetrics = metrics.filter((m) => m.metricType === 'key_result');
  const score = getPillarScore(keyResultMetrics);
  const status = calculatePillarStatus(score, pillar.color_thresholds);

  return {
    id: pillar.id,
    name: pillar.name,
    description: pillar.description,
    colorThresholds: pillar.color_thresholds,
    sortOrder: pillar.sort_order,
    createdAt: pillar.created_at,
    updatedAt: pillar.updated_at,
    score,
    status,
    metrics,
  };
}

// ============ EXECUTIVES ============

export async function getExecutives(): Promise<Executive[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('executives')
    .select('*')
    .order('sort_order');

  if (error) throw error;

  return data.map((e) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    headshotUrl: e.headshot_url,
    email: e.email,
    sortOrder: e.sort_order,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  }));
}

export async function getExecutiveById(id: string): Promise<ExecutiveWithDetails | null> {
  const supabase = createClient();

  const { data: exec, error } = await supabase
    .from('executives')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !exec) return null;

  // Get owned metrics
  const { data: metricOwners } = await supabase
    .from('metric_owners')
    .select('metric_id')
    .eq('executive_id', id);

  const metricIds = metricOwners?.map((mo) => mo.metric_id) || [];
  const ownedMetrics: MetricWithDetails[] = [];

  for (const metricId of metricIds) {
    const metric = await getMetricById(metricId);
    if (metric) ownedMetrics.push(metric);
  }

  // Get commitments
  const commitments = await getCommitmentsByExecutiveId(id);

  // Get report for current week
  const currentWeek = getCurrentWeekOf();
  const { data: reportData } = await supabase
    .from('executive_reports')
    .select('*')
    .eq('executive_id', id)
    .eq('week_of', currentWeek)
    .single();

  const report = reportData
    ? {
        id: reportData.id,
        executiveId: reportData.executive_id,
        content: reportData.content,
        weekOf: reportData.week_of,
        createdAt: reportData.created_at,
        updatedAt: reportData.updated_at,
      }
    : undefined;

  // Get improved metrics
  const improvedMetrics = ownedMetrics
    .filter((m) => m.status === 'green' && m.previousValue && m.currentValue > m.previousValue)
    .slice(0, 2);

  return {
    id: exec.id,
    name: exec.name,
    title: exec.title,
    headshotUrl: exec.headshot_url,
    email: exec.email,
    sortOrder: exec.sort_order,
    createdAt: exec.created_at,
    updatedAt: exec.updated_at,
    ownedMetrics,
    commitments,
    improvedMetrics,
    report,
  };
}

export async function getExecutivesWithDetails(): Promise<ExecutiveWithDetails[]> {
  log('getExecutivesWithDetails: Starting...');
  const startTime = Date.now();
  const supabase = createClient();
  const currentWeek = getCurrentWeekOf();

  // Fetch ALL data in parallel
  const [executivesResult, metricOwnersResult, commitmentsResult, reportsResult, metricsResult] = await Promise.all([
    supabase.from('executives').select('*').order('sort_order'),
    supabase.from('metric_owners').select('metric_id, executive_id'),
    supabase.from('commitments').select('*, commitment_updates(*)'),
    supabase.from('executive_reports').select('*').eq('week_of', currentWeek),
    supabase.from('metrics').select('*'),
  ]);

  if (executivesResult.error) throw executivesResult.error;

  const executives = executivesResult.data || [];
  const allMetricOwners = metricOwnersResult.data || [];
  const allCommitments = commitmentsResult.data || [];
  const allReports = reportsResult.data || [];
  const allMetrics = metricsResult.data || [];

  log(`getExecutivesWithDetails: Fetched all data in ${Date.now() - startTime}ms`);

  // Create lookup maps
  const metricOwnersByExecId = new Map<string, string[]>();
  allMetricOwners.forEach((mo: any) => {
    if (!metricOwnersByExecId.has(mo.executive_id)) metricOwnersByExecId.set(mo.executive_id, []);
    metricOwnersByExecId.get(mo.executive_id)!.push(mo.metric_id);
  });

  const commitmentsByExecId = new Map<string, any[]>();
  allCommitments.forEach((c: any) => {
    if (!commitmentsByExecId.has(c.executive_id)) commitmentsByExecId.set(c.executive_id, []);
    commitmentsByExecId.get(c.executive_id)!.push(c);
  });

  const reportsByExecId = new Map<string, any>();
  allReports.forEach((r: any) => {
    reportsByExecId.set(r.executive_id, r);
  });

  const metricsById = new Map<string, any>();
  allMetrics.forEach((m: any) => metricsById.set(m.id, m));

  // Build all executives at once
  const detailed: ExecutiveWithDetails[] = executives.map((exec) => {
    const ownedMetricIds = metricOwnersByExecId.get(exec.id) || [];
    const ownedMetrics: MetricWithDetails[] = ownedMetricIds.map((metricId) => {
      const metric = metricsById.get(metricId);
      if (!metric) return null;

      const status = getMetricStatus(
        metric.current_value,
        metric.target_value,
        { green: 90, yellow: 70 },
        metric.comparison_mode || 'at_or_above'
      );

      return {
        id: metric.id,
        pillarId: metric.pillar_id,
        name: metric.name,
        description: metric.description,
        dataSource: metric.data_source,
        apiConfig: metric.api_config,
        targetValue: metric.target_value,
        warningThreshold: metric.warning_threshold,
        criticalThreshold: metric.critical_threshold,
        currentValue: metric.current_value,
        previousValue: metric.previous_value,
        trendDirection: metric.trend_direction,
        lastUpdated: metric.last_updated,
        metricType: metric.metric_type,
        parentMetricId: metric.parent_metric_id,
        unit: metric.unit,
        format: metric.format,
        comparisonMode: metric.comparison_mode || 'at_or_above',
        cadence: metric.cadence || 'monthly',
        createdAt: metric.created_at,
        updatedAt: metric.updated_at,
        status,
        percentageOfTarget: getPercentageOfTarget(metric.current_value, metric.target_value),
        owners: [],
        narratives: [],
        commitments: [],
        history: [],
        childMetrics: [],
      };
    }).filter(Boolean) as MetricWithDetails[];

    const commitments = (commitmentsByExecId.get(exec.id) || [])
      .filter((c: any) => metricsById.has(c.metric_id))
      .map((c: any) => {
        const metric = metricsById.get(c.metric_id)!;
        return {
          id: c.id,
          executiveId: c.executive_id,
          metricId: c.metric_id,
          title: c.title,
          description: c.description,
          status: c.status,
          targetDate: c.target_date,
          completedAt: c.completed_at,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          metric: {
            id: metric.id,
            pillarId: metric.pillar_id,
            name: metric.name,
            description: metric.description,
            dataSource: metric.data_source,
            apiConfig: metric.api_config,
            targetValue: metric.target_value,
            warningThreshold: metric.warning_threshold,
            criticalThreshold: metric.critical_threshold,
            currentValue: metric.current_value,
            previousValue: metric.previous_value,
            trendDirection: metric.trend_direction,
            lastUpdated: metric.last_updated,
            metricType: metric.metric_type,
            parentMetricId: metric.parent_metric_id,
            unit: metric.unit,
            format: metric.format,
            comparisonMode: metric.comparison_mode || 'at_or_above',
            cadence: metric.cadence || 'monthly',
            createdAt: metric.created_at,
            updatedAt: metric.updated_at,
          },
          updates: (c.commitment_updates || []).map((u: any) => ({
            id: u.id,
            commitmentId: u.commitment_id,
            executiveId: u.executive_id,
            content: u.content,
            createdAt: u.created_at,
          })),
        };
      });

    const reportData = reportsByExecId.get(exec.id);
    const report = reportData
      ? {
          id: reportData.id,
          executiveId: reportData.executive_id,
          content: reportData.content,
          weekOf: reportData.week_of,
          createdAt: reportData.created_at,
          updatedAt: reportData.updated_at,
        }
      : undefined;

    const improvedMetrics = ownedMetrics
      .filter((m) => m.status === 'green' && m.previousValue && m.currentValue > m.previousValue)
      .slice(0, 2);

    return {
      id: exec.id,
      name: exec.name,
      title: exec.title,
      headshotUrl: exec.headshot_url,
      email: exec.email,
      sortOrder: exec.sort_order,
      createdAt: exec.created_at,
      updatedAt: exec.updated_at,
      ownedMetrics,
      commitments,
      improvedMetrics,
      report,
    };
  });

  log(`getExecutivesWithDetails: Complete - ${detailed.length} executives in ${Date.now() - startTime}ms total`);
  return detailed;
}

// ============ EXECUTIVE REPORTS ============

export async function saveExecutiveReport(
  executiveId: string,
  weekOf: string,
  content: string
): Promise<{ id: string; executiveId: string; content: string; weekOf: string; createdAt: string; updatedAt: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('executive_reports')
    .upsert({
      executive_id: executiveId,
      week_of: weekOf,
      content,
    }, {
      onConflict: 'executive_id,week_of',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    executiveId: data.executive_id,
    content: data.content,
    weekOf: data.week_of,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============ METRICS ============

export async function getMetricsByPillarId(pillarId: string): Promise<MetricWithDetails[]> {
  log(`getMetricsByPillarId: Starting for pillar ${pillarId}...`);
  const startTime = Date.now();
  const supabase = createClient();

  // Fetch ALL data in parallel with a single batch
  const [metricsResult, ownersResult, narrativesResult, commitmentsResult, historyResult] = await Promise.all([
    supabase.from('metrics').select('*').eq('pillar_id', pillarId).order('metric_type'),
    supabase.from('metric_owners').select('metric_id, executive_id, executives(*)'),
    supabase.from('narratives').select('*'),
    supabase.from('commitments').select('*, commitment_updates(*)'),
    supabase.from('metric_history').select('*').order('recorded_at', { ascending: false }),
  ]);

  if (metricsResult.error) throw metricsResult.error;

  const metrics = metricsResult.data || [];
  const metricIds = metrics.map((m) => m.id);

  // Create lookup maps for fast access
  const ownersByMetricId = new Map<string, any[]>();
  (ownersResult.data || []).forEach((o: any) => {
    if (!ownersByMetricId.has(o.metric_id)) ownersByMetricId.set(o.metric_id, []);
    ownersByMetricId.get(o.metric_id)!.push(o);
  });

  const narrativesByMetricId = new Map<string, any[]>();
  (narrativesResult.data || []).forEach((n: any) => {
    if (metricIds.includes(n.metric_id)) {
      if (!narrativesByMetricId.has(n.metric_id)) narrativesByMetricId.set(n.metric_id, []);
      narrativesByMetricId.get(n.metric_id)!.push(n);
    }
  });

  const commitmentsByMetricId = new Map<string, any[]>();
  (commitmentsResult.data || []).forEach((c: any) => {
    if (metricIds.includes(c.metric_id)) {
      if (!commitmentsByMetricId.has(c.metric_id)) commitmentsByMetricId.set(c.metric_id, []);
      commitmentsByMetricId.get(c.metric_id)!.push(c);
    }
  });

  const historyByMetricId = new Map<string, any[]>();
  (historyResult.data || []).forEach((h: any) => {
    if (metricIds.includes(h.metric_id)) {
      if (!historyByMetricId.has(h.metric_id)) historyByMetricId.set(h.metric_id, []);
      const arr = historyByMetricId.get(h.metric_id)!;
      if (arr.length < 12) arr.push(h); // Limit to 12
    }
  });

  // Build all metrics at once using lookup maps
  const detailedMetrics: MetricWithDetails[] = metrics.map((metric) => {
    const owners = (ownersByMetricId.get(metric.id) || []).map((o: any) => ({
      id: o.executives.id,
      name: o.executives.name,
      title: o.executives.title,
      headshotUrl: o.executives.headshot_url,
      email: o.executives.email,
      sortOrder: o.executives.sort_order,
      createdAt: o.executives.created_at,
      updatedAt: o.executives.updated_at,
    }));

    const narratives: Narrative[] = (narrativesByMetricId.get(metric.id) || []).map((n: any) => ({
      id: n.id,
      metricId: n.metric_id,
      executiveId: n.executive_id,
      content: n.content,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));

    const commitments = (commitmentsByMetricId.get(metric.id) || []).map((c: any) => ({
      id: c.id,
      executiveId: c.executive_id,
      metricId: c.metric_id,
      title: c.title,
      description: c.description,
      status: c.status,
      targetDate: c.target_date,
      completedAt: c.completed_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      metric: {
        id: metric.id,
        pillarId: metric.pillar_id,
        name: metric.name,
        description: metric.description,
        dataSource: metric.data_source,
        apiConfig: metric.api_config,
        targetValue: metric.target_value,
        warningThreshold: metric.warning_threshold,
        criticalThreshold: metric.critical_threshold,
        currentValue: metric.current_value,
        previousValue: metric.previous_value,
        trendDirection: metric.trend_direction,
        lastUpdated: metric.last_updated,
        metricType: metric.metric_type,
        parentMetricId: metric.parent_metric_id,
        unit: metric.unit,
        format: metric.format,
        comparisonMode: metric.comparison_mode || 'at_or_above',
        cadence: metric.cadence || 'monthly',
        createdAt: metric.created_at,
        updatedAt: metric.updated_at,
      },
      updates: (c.commitment_updates || []).map((u: any) => ({
        id: u.id,
        commitmentId: u.commitment_id,
        executiveId: u.executive_id,
        content: u.content,
        createdAt: u.created_at,
      })),
    }));

    const history: MetricHistory[] = (historyByMetricId.get(metric.id) || []).map((h: any) => ({
      id: h.id,
      metricId: h.metric_id,
      value: h.value,
      recordedAt: h.recorded_at,
    }));

    const status = getMetricStatus(
      metric.current_value,
      metric.target_value,
      { green: 90, yellow: 70 },
      metric.comparison_mode || 'at_or_above'
    );

    return {
      id: metric.id,
      pillarId: metric.pillar_id,
      name: metric.name,
      description: metric.description,
      dataSource: metric.data_source,
      apiConfig: metric.api_config,
      targetValue: metric.target_value,
      warningThreshold: metric.warning_threshold,
      criticalThreshold: metric.critical_threshold,
      currentValue: metric.current_value,
      previousValue: metric.previous_value,
      trendDirection: metric.trend_direction,
      lastUpdated: metric.last_updated,
      metricType: metric.metric_type,
      parentMetricId: metric.parent_metric_id,
      unit: metric.unit,
      format: metric.format,
      comparisonMode: metric.comparison_mode || 'at_or_above',
      cadence: metric.cadence || 'monthly',
      createdAt: metric.created_at,
      updatedAt: metric.updated_at,
      status,
      percentageOfTarget: getPercentageOfTarget(metric.current_value, metric.target_value),
      owners,
      narratives,
      commitments,
      history,
      childMetrics: [],
    };
  });

  // Organize into hierarchy (key results with their children)
  const keyResults = detailedMetrics.filter((m) => m.metricType === 'key_result');

  for (const kr of keyResults) {
    kr.childMetrics = detailedMetrics.filter((m) => m.parentMetricId === kr.id);
  }

  log(`getMetricsByPillarId: Complete - ${keyResults.length} key results in ${Date.now() - startTime}ms`);
  return keyResults;
}

export async function getMetricById(id: string): Promise<MetricWithDetails | null> {
  const supabase = createClient();

  const { data: metric, error } = await supabase
    .from('metrics')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !metric) return null;

  return buildMetricWithDetails(metric);
}

async function buildMetricWithDetails(metric: any): Promise<MetricWithDetails> {
  const supabase = createClient();

  // Get owners
  const { data: ownerData } = await supabase
    .from('metric_owners')
    .select('executive_id, executives(*)')
    .eq('metric_id', metric.id);

  const owners =
    ownerData?.map((o: any) => ({
      id: o.executives.id,
      name: o.executives.name,
      title: o.executives.title,
      headshotUrl: o.executives.headshot_url,
      email: o.executives.email,
      sortOrder: o.executives.sort_order,
      createdAt: o.executives.created_at,
      updatedAt: o.executives.updated_at,
    })) || [];

  // Get narratives
  const { data: narrativeData } = await supabase
    .from('narratives')
    .select('*')
    .eq('metric_id', metric.id);

  const narratives: Narrative[] =
    narrativeData?.map((n: any) => ({
      id: n.id,
      metricId: n.metric_id,
      executiveId: n.executive_id,
      content: n.content,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    })) || [];

  // Get commitments
  const { data: commitmentData } = await supabase
    .from('commitments')
    .select('*, commitment_updates(*)')
    .eq('metric_id', metric.id);

  const commitments =
    commitmentData?.map((c: any) => ({
      id: c.id,
      executiveId: c.executive_id,
      metricId: c.metric_id,
      title: c.title,
      description: c.description,
      status: c.status,
      targetDate: c.target_date,
      completedAt: c.completed_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      metric,
      updates:
        c.commitment_updates?.map((u: any) => ({
          id: u.id,
          commitmentId: u.commitment_id,
          executiveId: u.executive_id,
          content: u.content,
          createdAt: u.created_at,
        })) || [],
    })) || [];

  // Get history
  const { data: historyData } = await supabase
    .from('metric_history')
    .select('*')
    .eq('metric_id', metric.id)
    .order('recorded_at', { ascending: false })
    .limit(12);

  const history: MetricHistory[] =
    historyData?.map((h: any) => ({
      id: h.id,
      metricId: h.metric_id,
      value: h.value,
      recordedAt: h.recorded_at,
    })) || [];

  // Get child metrics
  const { data: childData } = await supabase
    .from('metrics')
    .select('*')
    .eq('parent_metric_id', metric.id);

  const childMetrics: MetricWithDetails[] = [];
  if (childData) {
    for (const child of childData) {
      const childDetailed = await buildMetricWithDetails(child);
      childMetrics.push(childDetailed);
    }
  }

  const status = getMetricStatus(
    metric.current_value,
    metric.target_value,
    { green: 90, yellow: 70 },
    metric.comparison_mode || 'at_or_above'
  );

  return {
    id: metric.id,
    pillarId: metric.pillar_id,
    name: metric.name,
    description: metric.description,
    dataSource: metric.data_source,
    apiConfig: metric.api_config,
    targetValue: metric.target_value,
    currentValue: metric.current_value,
    previousValue: metric.previous_value,
    warningThreshold: metric.warning_threshold,
    criticalThreshold: metric.critical_threshold,
    trendDirection: metric.trend_direction,
    lastUpdated: metric.last_updated,
    metricType: metric.metric_type,
    parentMetricId: metric.parent_metric_id,
    format: metric.format,
    comparisonMode: metric.comparison_mode || 'at_or_above',
    cadence: metric.cadence || 'monthly',
    createdAt: metric.created_at,
    updatedAt: metric.updated_at,
    status,
    percentageOfTarget: getPercentageOfTarget(metric.current_value, metric.target_value),
    owners,
    narratives,
    commitments,
    history,
    childMetrics: childMetrics.length > 0 ? childMetrics : undefined,
  };
}

// ============ COMMITMENTS ============

export async function getCommitmentsByExecutiveId(executiveId: string): Promise<any[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('commitments')
    .select('*, commitment_updates(*), metrics(*)')
    .eq('executive_id', executiveId);

  if (error) throw error;

  return (
    data?.map((c: any) => ({
      id: c.id,
      executiveId: c.executive_id,
      metricId: c.metric_id,
      title: c.title,
      description: c.description,
      status: c.status,
      targetDate: c.target_date,
      completedAt: c.completed_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      metric: c.metrics,
      updates:
        c.commitment_updates?.map((u: any) => ({
          id: u.id,
          commitmentId: u.commitment_id,
          executiveId: u.executive_id,
          content: u.content,
          createdAt: u.created_at,
        })) || [],
    })) || []
  );
}

// ============ TALKING ITEMS ============

export async function getTalkingItems(weekOf?: string): Promise<TalkingItem[]> {
  const supabase = createClient();
  const targetWeek = weekOf || getCurrentWeekOf();

  const { data, error } = await supabase
    .from('talking_items')
    .select('*, executives(name)')
    .eq('week_of', targetWeek)
    .order('priority')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (
    data?.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      addedBy: t.added_by,
      addedByName: t.executives?.name,
      priority: t.priority,
      status: t.status,
      relatedMetricId: t.related_metric_id,
      relatedPillarId: t.related_pillar_id,
      weekOf: t.week_of,
      discussedAt: t.discussed_at,
      notes: t.notes,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })) || []
  );
}

export async function createTalkingItem(
  item: Omit<TalkingItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TalkingItem> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('talking_items')
    .insert({
      title: item.title,
      description: item.description,
      added_by: item.addedBy,
      priority: item.priority,
      status: item.status,
      related_metric_id: item.relatedMetricId,
      related_pillar_id: item.relatedPillarId,
      week_of: item.weekOf,
      notes: item.notes,
    })
    .select('*, executives(name)')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    addedBy: data.added_by,
    addedByName: data.executives?.name,
    priority: data.priority,
    status: data.status,
    relatedMetricId: data.related_metric_id,
    relatedPillarId: data.related_pillar_id,
    weekOf: data.week_of,
    discussedAt: data.discussed_at,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateTalkingItem(id: string, updates: Partial<TalkingItem>): Promise<void> {
  const supabase = createClient();

  const dbUpdates: any = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.discussedAt !== undefined) dbUpdates.discussed_at = updates.discussedAt;

  const { error } = await supabase.from('talking_items').update(dbUpdates).eq('id', id);

  if (error) throw error;
}

export async function deleteTalkingItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('talking_items').delete().eq('id', id);
  if (error) throw error;
}

// ============ MEETING NOTES ============

export async function getMeetingNotes(weekOf: string): Promise<MeetingNotes | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('meeting_notes')
    .select('*')
    .eq('week_of', weekOf)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    weekOf: data.week_of,
    content: data.content,
    generatedAt: data.generated_at,
  };
}

export async function saveMeetingNotes(weekOf: string, content: string): Promise<MeetingNotes> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('meeting_notes')
    .upsert({
      week_of: weekOf,
      content,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    weekOf: data.week_of,
    content: data.content,
    generatedAt: data.generated_at,
  };
}

// ============ OVERVIEW REPORTS ============

export async function getOverviewReport(weekOf: string): Promise<OverviewReport | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('overview_reports')
    .select('*, executives(name)')
    .eq('week_of', weekOf)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    weekOf: data.week_of,
    authorId: data.author_id,
    authorName: data.executives?.name,
    narrative: data.narrative,
    highlights: data.highlights || [],
    concerns: data.concerns || [],
    isPublished: data.is_published,
    publishedAt: data.published_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function saveOverviewReport(
  weekOf: string,
  authorId: string,
  narrative: string,
  highlights: string[],
  concerns: string[],
  isPublished: boolean = false
): Promise<OverviewReport> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('overview_reports')
    .upsert({
      week_of: weekOf,
      author_id: authorId,
      narrative,
      highlights,
      concerns,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
    })
    .select('*, executives(name)')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    weekOf: data.week_of,
    authorId: data.author_id,
    authorName: data.executives?.name,
    narrative: data.narrative,
    highlights: data.highlights || [],
    concerns: data.concerns || [],
    isPublished: data.is_published,
    publishedAt: data.published_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateOverviewReport(
  weekOf: string,
  updates: {
    narrative?: string;
    highlights?: string[];
    concerns?: string[];
    isPublished?: boolean;
  }
): Promise<void> {
  const supabase = createClient();

  const dbUpdates: any = {};
  if (updates.narrative !== undefined) dbUpdates.narrative = updates.narrative;
  if (updates.highlights !== undefined) dbUpdates.highlights = updates.highlights;
  if (updates.concerns !== undefined) dbUpdates.concerns = updates.concerns;
  if (updates.isPublished !== undefined) {
    dbUpdates.is_published = updates.isPublished;
    if (updates.isPublished) {
      dbUpdates.published_at = new Date().toISOString();
    }
  }

  const { error } = await supabase
    .from('overview_reports')
    .update(dbUpdates)
    .eq('week_of', weekOf);

  if (error) throw error;
}

// ============ METRIC REVIEWS ============

export async function getMetricReviews(weekOf?: string): Promise<MetricReviewItem[]> {
  const supabase = createClient();
  const targetWeek = weekOf || getCurrentWeekOf();

  const { data, error } = await supabase
    .from('metric_reviews')
    .select('*, metrics(*, pillars(*))')
    .eq('week_of', targetWeek);

  if (error) throw error;

  const reviews: MetricReviewItem[] = [];

  for (const r of data || []) {
    const metric = await getMetricById(r.metric_id);
    if (metric) {
      reviews.push({
        id: r.id,
        metricId: r.metric_id,
        metric,
        pillarId: r.metrics.pillar_id,
        pillarName: r.metrics.pillars.name,
        status: r.status,
        deferredUntil: r.deferred_until,
        deferReason: r.defer_reason,
        commitmentId: r.commitment_id,
        reviewedAt: r.reviewed_at,
        reviewedBy: r.reviewed_by,
        notes: r.notes,
        weekOf: r.week_of,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }
  }

  return reviews;
}

export async function createOrUpdateMetricReview(
  metricId: string,
  weekOf: string,
  updates: Partial<MetricReviewItem>
): Promise<void> {
  const supabase = createClient();

  const dbUpdates: any = {
    metric_id: metricId,
    week_of: weekOf,
  };

  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.deferredUntil !== undefined) dbUpdates.deferred_until = updates.deferredUntil;
  if (updates.deferReason !== undefined) dbUpdates.defer_reason = updates.deferReason;
  if (updates.commitmentId !== undefined) dbUpdates.commitment_id = updates.commitmentId;
  if (updates.reviewedAt !== undefined) dbUpdates.reviewed_at = updates.reviewedAt;
  if (updates.reviewedBy !== undefined) dbUpdates.reviewed_by = updates.reviewedBy;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { error } = await supabase.from('metric_reviews').upsert(dbUpdates);

  if (error) throw error;
}

// ============ METRIC TARGETS (Period-Specific Goals) ============

export interface MetricTarget {
  id: string;
  metricId: string;
  period: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  year: number;
  periodNumber: number | null;
  targetValue: number;
  createdAt: string;
  updatedAt: string;
}

export async function getMetricTargets(metricId: string, year?: number): Promise<MetricTarget[]> {
  const supabase = createClient();
  const targetYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from('metric_targets')
    .select('*')
    .eq('metric_id', metricId)
    .eq('year', targetYear)
    .order('period')
    .order('period_number');

  if (error) {
    // Table might not exist yet - return empty array
    if (error.code === '42P01') {
      log('metric_targets table does not exist yet');
      return [];
    }
    throw error;
  }

  return (data || []).map((t: any) => ({
    id: t.id,
    metricId: t.metric_id,
    period: t.period,
    year: t.year,
    periodNumber: t.period_number,
    targetValue: parseFloat(t.target_value),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

export async function getAllMetricTargetsForYear(year?: number): Promise<Map<string, MetricTarget[]>> {
  const supabase = createClient();
  const targetYear = year || new Date().getFullYear();

  const { data, error } = await supabase
    .from('metric_targets')
    .select('*')
    .eq('year', targetYear)
    .order('period')
    .order('period_number');

  if (error) {
    if (error.code === '42P01') {
      log('metric_targets table does not exist yet');
      return new Map();
    }
    throw error;
  }

  const targetsByMetricId = new Map<string, MetricTarget[]>();
  (data || []).forEach((t: any) => {
    const target: MetricTarget = {
      id: t.id,
      metricId: t.metric_id,
      period: t.period,
      year: t.year,
      periodNumber: t.period_number,
      targetValue: parseFloat(t.target_value),
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };

    if (!targetsByMetricId.has(t.metric_id)) {
      targetsByMetricId.set(t.metric_id, []);
    }
    targetsByMetricId.get(t.metric_id)!.push(target);
  });

  return targetsByMetricId;
}

export async function saveMetricTarget(
  metricId: string,
  period: 'weekly' | 'monthly' | 'quarterly' | 'annual',
  year: number,
  periodNumber: number | null,
  targetValue: number,
  warningThreshold?: number,
  criticalThreshold?: number,
  notes?: string
): Promise<MetricTarget> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('metric_targets')
    .upsert({
      metric_id: metricId,
      period,
      year,
      period_number: periodNumber,
      target_value: targetValue,
    }, {
      onConflict: 'metric_id,period,year,period_number',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    metricId: data.metric_id,
    period: data.period,
    year: data.year,
    periodNumber: data.period_number,
    targetValue: parseFloat(data.target_value),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteMetricTarget(targetId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('metric_targets').delete().eq('id', targetId);
  if (error) throw error;
}

/**
 * Get the current period's target for a metric based on its cadence
 * Returns the most relevant target: current period if available, otherwise annual
 */
export async function getCurrentPeriodTarget(
  metricId: string,
  cadence: 'weekly' | 'monthly' | 'quarterly' | 'annual' = 'monthly'
): Promise<MetricTarget | null> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const quarter = Math.ceil(month / 3); // 1-4
  const week = getWeekNumber(now); // 1-52

  const targets = await getMetricTargets(metricId, year);
  if (targets.length === 0) return null;

  // Try to find the target for the current period based on cadence
  let currentTarget: MetricTarget | undefined;

  switch (cadence) {
    case 'weekly':
      currentTarget = targets.find(t => t.period === 'weekly' && t.periodNumber === week);
      break;
    case 'monthly':
      currentTarget = targets.find(t => t.period === 'monthly' && t.periodNumber === month);
      break;
    case 'quarterly':
      currentTarget = targets.find(t => t.period === 'quarterly' && t.periodNumber === quarter);
      break;
    case 'annual':
      currentTarget = targets.find(t => t.period === 'annual');
      break;
  }

  // If we found a target for the current period, return it
  if (currentTarget) return currentTarget;

  // Fallback: try to find quarterly target, then annual
  if (cadence !== 'quarterly') {
    currentTarget = targets.find(t => t.period === 'quarterly' && t.periodNumber === quarter);
    if (currentTarget) return currentTarget;
  }

  // Final fallback: annual target
  return targets.find(t => t.period === 'annual') || null;
}

/**
 * Get the ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get the display label for a period target
 */
export function getPeriodLabel(target: MetricTarget): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  switch (target.period) {
    case 'weekly':
      return `Week ${target.periodNumber} ${target.year}`;
    case 'monthly':
      return `${monthNames[(target.periodNumber || 1) - 1]} ${target.year}`;
    case 'quarterly':
      return `Q${target.periodNumber} ${target.year}`;
    case 'annual':
      return `${target.year} Annual`;
    default:
      return `${target.year}`;
  }
}

// ============ METRIC CRUD OPERATIONS ============

export interface CreateMetricInput {
  pillarId: string;
  name: string;
  description?: string;
  dataSource?: string;
  targetValue: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  currentValue?: number;
  metricType?: string;
  parentMetricId?: string;
  unit?: string;
  format?: string;
  comparisonMode?: string;
  cadence?: string;
}

export interface UpdateMetricInput {
  name?: string;
  description?: string;
  dataSource?: string;
  targetValue?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  currentValue?: number;
  metricType?: string;
  parentMetricId?: string | null;
  unit?: string;
  format?: string;
  comparisonMode?: string;
  cadence?: string;
}

export async function createMetric(input: CreateMetricInput): Promise<Metric> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('metrics')
    .insert({
      pillar_id: input.pillarId,
      name: input.name,
      description: input.description || '',
      data_source: input.dataSource || 'manual',
      target_value: input.targetValue,
      warning_threshold: input.warningThreshold ?? 70,
      critical_threshold: input.criticalThreshold ?? 50,
      current_value: input.currentValue ?? 0,
      metric_type: input.metricType || 'key_result',
      parent_metric_id: input.parentMetricId || null,
      unit: input.unit || null,
      format: input.format || 'number',
      comparison_mode: input.comparisonMode || 'at_or_above',
      cadence: input.cadence || 'monthly',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    pillarId: data.pillar_id,
    name: data.name,
    description: data.description,
    dataSource: data.data_source,
    apiConfig: data.api_config || {},
    targetValue: data.target_value,
    warningThreshold: data.warning_threshold,
    criticalThreshold: data.critical_threshold,
    currentValue: data.current_value,
    previousValue: data.previous_value,
    trendDirection: data.trend_direction || 'flat',
    lastUpdated: data.last_updated,
    metricType: data.metric_type,
    parentMetricId: data.parent_metric_id,
    unit: data.unit,
    format: data.format,
    comparisonMode: data.comparison_mode || 'at_or_above',
    cadence: data.cadence || 'monthly',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateMetric(id: string, input: UpdateMetricInput): Promise<void> {
  const supabase = createClient();

  const updates: any = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.dataSource !== undefined) updates.data_source = input.dataSource;
  if (input.targetValue !== undefined) updates.target_value = input.targetValue;
  if (input.warningThreshold !== undefined) updates.warning_threshold = input.warningThreshold;
  if (input.criticalThreshold !== undefined) updates.critical_threshold = input.criticalThreshold;
  if (input.currentValue !== undefined) updates.current_value = input.currentValue;
  if (input.metricType !== undefined) updates.metric_type = input.metricType;
  if (input.parentMetricId !== undefined) updates.parent_metric_id = input.parentMetricId;
  if (input.unit !== undefined) updates.unit = input.unit;
  if (input.format !== undefined) updates.format = input.format;
  if (input.comparisonMode !== undefined) updates.comparison_mode = input.comparisonMode;
  if (input.cadence !== undefined) updates.cadence = input.cadence;

  const { error } = await supabase
    .from('metrics')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteMetric(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('metrics').delete().eq('id', id);
  if (error) throw error;
}

export async function updateMetricValue(id: string, value: number): Promise<void> {
  const supabase = createClient();

  // Get current value to set as previous
  const { data: current } = await supabase
    .from('metrics')
    .select('current_value')
    .eq('id', id)
    .single();

  const previousValue = current?.current_value;

  // Determine trend direction
  let trendDirection = 'flat';
  if (previousValue !== null && previousValue !== undefined) {
    if (value > previousValue) trendDirection = 'up';
    else if (value < previousValue) trendDirection = 'down';
  }

  // Update metric
  const { error: updateError } = await supabase
    .from('metrics')
    .update({
      current_value: value,
      previous_value: previousValue,
      trend_direction: trendDirection,
      last_updated: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) throw updateError;

  // Add to history
  const { error: historyError } = await supabase
    .from('metric_history')
    .insert({
      metric_id: id,
      value: value,
      recorded_at: new Date().toISOString(),
    });

  if (historyError) {
    console.error('Failed to add metric history:', historyError);
  }
}

export async function addMetricOwner(metricId: string, executiveId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('metric_owners')
    .insert({ metric_id: metricId, executive_id: executiveId });
  if (error && error.code !== '23505') throw error; // Ignore duplicate key error
}

export async function removeMetricOwner(metricId: string, executiveId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('metric_owners')
    .delete()
    .eq('metric_id', metricId)
    .eq('executive_id', executiveId);
  if (error) throw error;
}

// ============ PILLAR CRUD OPERATIONS ============

export interface CreatePillarInput {
  name: string;
  description?: string;
  colorThresholds?: { green: number; yellow: number };
  sortOrder?: number;
}

export interface UpdatePillarInput {
  name?: string;
  description?: string;
  colorThresholds?: { green: number; yellow: number };
  sortOrder?: number;
}

export async function createPillar(input: CreatePillarInput): Promise<Pillar> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('pillars')
    .insert({
      name: input.name,
      description: input.description || '',
      color_thresholds: input.colorThresholds || { green: 90, yellow: 70 },
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    colorThresholds: data.color_thresholds,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updatePillar(id: string, input: UpdatePillarInput): Promise<void> {
  const supabase = createClient();

  const updates: any = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.colorThresholds !== undefined) updates.color_thresholds = input.colorThresholds;
  if (input.sortOrder !== undefined) updates.sort_order = input.sortOrder;

  const { error } = await supabase
    .from('pillars')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deletePillar(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('pillars').delete().eq('id', id);
  if (error) throw error;
}

// ============ USER MANAGEMENT ============

export type UserRole = 'admin' | 'executive' | 'viewer';

export interface ApprovedUser {
  id: string;
  email: string;
  role: UserRole;
  executiveId: string | null;
  authUserId: string | null;
  isActive: boolean;
  invitedBy: string | null;
  invitedAt: string;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  executive?: Executive | null;
}

export async function getApprovedUsers(): Promise<ApprovedUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('approved_users')
    .select(`
      *,
      executives (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approved users:', error);
    return [];
  }

  return data.map((u: any) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    executiveId: u.executive_id,
    authUserId: u.auth_user_id,
    isActive: u.is_active,
    invitedBy: u.invited_by,
    invitedAt: u.invited_at,
    firstLoginAt: u.first_login_at,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    executive: u.executives ? {
      id: u.executives.id,
      name: u.executives.name,
      title: u.executives.title,
      headshotUrl: u.executives.headshot_url,
      email: u.executives.email,
      sortOrder: u.executives.sort_order,
      createdAt: u.executives.created_at,
      updatedAt: u.executives.updated_at,
    } : null,
  }));
}

export async function checkUserApproved(email: string): Promise<ApprovedUser | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('approved_users')
    .select(`
      *,
      executives (*)
    `)
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    executiveId: data.executive_id,
    authUserId: data.auth_user_id,
    isActive: data.is_active,
    invitedBy: data.invited_by,
    invitedAt: data.invited_at,
    firstLoginAt: data.first_login_at,
    lastLoginAt: data.last_login_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    executive: data.executives ? {
      id: data.executives.id,
      name: data.executives.name,
      title: data.executives.title,
      headshotUrl: data.executives.headshot_url,
      email: data.executives.email,
      sortOrder: data.executives.sort_order,
      createdAt: data.executives.created_at,
      updatedAt: data.executives.updated_at,
    } : null,
  };
}

export async function linkAuthUser(email: string, authUserId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('approved_users')
    .update({
      auth_user_id: authUserId,
      first_login_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    })
    .eq('email', email.toLowerCase())
    .is('auth_user_id', null);

  if (error) {
    console.error('Error linking auth user:', error);
  }

  // Update last login if already linked
  await supabase
    .from('approved_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('email', email.toLowerCase());
}

export interface CreateUserInput {
  email: string;
  role: UserRole;
  executiveId?: string | null;
}

export async function createApprovedUser(input: CreateUserInput): Promise<ApprovedUser> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('approved_users')
    .insert({
      email: input.email.toLowerCase(),
      role: input.role,
      executive_id: input.executiveId || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    email: data.email,
    role: data.role,
    executiveId: data.executive_id,
    authUserId: data.auth_user_id,
    isActive: data.is_active,
    invitedBy: data.invited_by,
    invitedAt: data.invited_at,
    firstLoginAt: data.first_login_at,
    lastLoginAt: data.last_login_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateApprovedUser(
  id: string,
  updates: { role?: UserRole; executiveId?: string | null; isActive?: boolean }
): Promise<void> {
  const supabase = createClient();
  const updateData: any = {};
  if (updates.role !== undefined) updateData.role = updates.role;
  if (updates.executiveId !== undefined) updateData.executive_id = updates.executiveId;
  if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

  const { error } = await supabase
    .from('approved_users')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteApprovedUser(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('approved_users')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getCurrentUserRole(email: string): Promise<UserRole | null> {
  const user = await checkUserApproved(email);
  return user?.role || null;
}

// ============ EXECUTIVE CRUD WITH USER LINKING ============

export interface CreateExecutiveInput {
  name: string;
  title: string;
  email: string;
  headshotUrl?: string;
  sortOrder?: number;
  authUserId?: string | null; // Link to auth.users
  createUserAccount?: boolean; // Also create an approved_user entry
}

export async function createExecutive(input: CreateExecutiveInput): Promise<Executive> {
  const supabase = createClient();

  // Create executive
  const { data, error } = await supabase
    .from('executives')
    .insert({
      name: input.name,
      title: input.title,
      email: input.email.toLowerCase(),
      headshot_url: input.headshotUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name)}&background=6941C6&color=fff`,
      sort_order: input.sortOrder ?? 0,
      auth_user_id: input.authUserId || null,
    })
    .select()
    .single();

  if (error) throw error;

  // If linking to an existing user, update approved_users to link back to this executive
  if (input.authUserId) {
    await supabase
      .from('approved_users')
      .update({ executive_id: data.id })
      .eq('auth_user_id', input.authUserId);
  }

  // Optionally create user account linked to this executive
  if (input.createUserAccount) {
    await supabase
      .from('approved_users')
      .upsert({
        email: input.email.toLowerCase(),
        role: 'executive',
        executive_id: data.id,
      }, { onConflict: 'email' });
  }

  return {
    id: data.id,
    name: data.name,
    title: data.title,
    headshotUrl: data.headshot_url,
    email: data.email,
    sortOrder: data.sort_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateExecutive(
  id: string,
  updates: { name?: string; title?: string; email?: string; headshotUrl?: string; sortOrder?: number; authUserId?: string | null }
): Promise<void> {
  const supabase = createClient();
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.email !== undefined) updateData.email = updates.email.toLowerCase();
  if (updates.headshotUrl !== undefined) updateData.headshot_url = updates.headshotUrl;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
  if (updates.authUserId !== undefined) updateData.auth_user_id = updates.authUserId;

  const { error } = await supabase
    .from('executives')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;

  // Handle bidirectional linking with approved_users
  if (updates.authUserId !== undefined) {
    // First, clear any approved_users that currently point to this executive
    await supabase
      .from('approved_users')
      .update({ executive_id: null })
      .eq('executive_id', id);

    // Then, if linking to a user, update that user's approved_users record
    if (updates.authUserId) {
      await supabase
        .from('approved_users')
        .update({ executive_id: id })
        .eq('auth_user_id', updates.authUserId);
    }
  }
}

export async function deleteExecutive(id: string): Promise<void> {
  const supabase = createClient();

  // First, unlink any approved_users pointing to this executive
  await supabase
    .from('approved_users')
    .update({ executive_id: null })
    .eq('executive_id', id);

  const { error } = await supabase
    .from('executives')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ DASHBOARD DATA ============

export async function getDashboardData(): Promise<DashboardData> {
  log('getDashboardData: Starting...');
  const startTime = Date.now();

  log('getDashboardData: Fetching pillars...');
  const pillars = await getPillars();
  log(`getDashboardData: Got ${pillars.length} pillars in ${Date.now() - startTime}ms`);

  // Load all pillars and executives in parallel
  log('getDashboardData: Loading pillar details and executives in parallel...');
  const [pillarsWithScores, executives] = await Promise.all([
    Promise.all(pillars.map((pillar) => getPillarById(pillar.id))),
    getExecutivesWithDetails(),
  ]);

  const validPillars = pillarsWithScores.filter(Boolean) as PillarWithScore[];
  log(`getDashboardData: Got ${validPillars.length} pillars with scores and ${executives.length} executives`);

  const overview = generateOverviewSummary(validPillars);

  log(`getDashboardData: Complete in ${Date.now() - startTime}ms total`);

  return {
    pillars: validPillars,
    executives,
    overview,
    lastRefreshed: new Date().toISOString(),
  };
}

export async function getDashboardDataExtended(): Promise<DashboardDataExtended> {
  log('getDashboardDataExtended: Starting...');
  const startTime = Date.now();

  const baseData = await getDashboardData();
  const currentWeek = getCurrentWeekOf();

  log('getDashboardDataExtended: Fetching talking items and overview report...');
  const [talkingItems, overviewReport] = await Promise.all([
    getTalkingItems(currentWeek),
    getOverviewReport(currentWeek),
  ]);
  log(`getDashboardDataExtended: Got ${talkingItems.length} talking items`);

  log('getDashboardDataExtended: Generating metrics to review...');
  const metricsToReview = await generateMetricsToReview(baseData.pillars, currentWeek);
  log(`getDashboardDataExtended: Got ${metricsToReview.length} metrics to review`);

  log(`getDashboardDataExtended: Complete in ${Date.now() - startTime}ms total`);

  return {
    ...baseData,
    talkingItems,
    metricsToReview,
    overviewReport: overviewReport || undefined,
  };
}

export async function getDashboardDataForWeek(weekOf: string): Promise<DashboardDataExtended> {
  const baseData = await getDashboardData();
  const currentWeek = getCurrentWeekOf();
  const isPastWeek = weekOf < currentWeek;

  const [talkingItems, overviewReport, meetingNotes] = await Promise.all([
    getTalkingItems(weekOf),
    getOverviewReport(weekOf),
    isPastWeek ? getMeetingNotes(weekOf) : Promise.resolve(null),
  ]);
  const metricsToReview = await generateMetricsToReview(baseData.pillars, weekOf);

  return {
    ...baseData,
    talkingItems,
    metricsToReview,
    meetingNotes: meetingNotes || undefined,
    overviewReport: overviewReport || undefined,
  };
}

// ============ HELPER FUNCTIONS ============

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

  // Count active commitments (this would need to be fetched from DB in production)
  const activeCommitments = 4; // Placeholder

  const highlights: string[] = [];
  const concerns: string[] = [];

  pillarsWithScores.forEach((pillar) => {
    if (pillar.status === 'green') {
      highlights.push(`${pillar.name} is performing above expectations at ${pillar.score}%`);
    } else if (pillar.status === 'red') {
      concerns.push(`${pillar.name} needs attention - currently at ${pillar.score}%`);
    }
  });

  allMetrics.forEach((metric) => {
    if (metric.percentageOfTarget >= 100) {
      highlights.push(`${metric.name} has exceeded target`);
    }
    if (metric.status === 'red' && metric.trendDirection === 'down') {
      concerns.push(`${metric.name} is declining and below target`);
    }
  });

  // Generate narrative based on status
  let narrative = '';
  const totalPillars = pillarsWithScores.length;
  const greenPillarNames = pillarsWithScores.filter((p) => p.status === 'green').map((p) => p.name);
  const yellowPillarNames = pillarsWithScores.filter((p) => p.status === 'yellow').map((p) => p.name);
  const redPillarNames = pillarsWithScores.filter((p) => p.status === 'red').map((p) => p.name);

  if (overallStatus === 'green') {
    narrative = `This week reflects strong execution across the organization, with Hapax achieving an overall performance score of ${overallScore}%. ${pillarsOnTrack} of our ${totalPillars} strategic pillars are performing at or above target.

Looking at the underlying metrics, we're seeing positive momentum with ${metricsImproved} metrics trending upward week-over-week.

The executive team is aligned on priorities for the coming week, with clear ownership and accountability across all strategic initiatives.`;
  } else if (overallStatus === 'yellow') {
    narrative = `This week's performance reflects mixed results across the organization, with an overall score of ${overallScore}%. While we're seeing strength in certain areas, ${pillarsAtRisk + pillarsOffTrack} of our ${totalPillars} strategic pillars require focused attention.

Analyzing the metric trends, ${metricsImproved} metrics are showing improvement while ${metricsDeclined} are declining.

The leadership team has active commitments in place to address the key challenges.`;
  } else {
    narrative = `This week has been challenging, with an overall performance score of ${overallScore}% indicating we are significantly behind on our strategic objectives. ${pillarsOffTrack} of our ${totalPillars} pillars are off track.

The metric analysis reveals ${metricsDeclined} declining metrics against ${metricsImproved} improving.

The executive team is mobilizing with active commitments to reverse these trends.`;
  }

  return {
    overallScore,
    overallStatus,
    narrative,
    highlights: highlights.slice(0, 3),
    concerns: concerns.slice(0, 3),
    weekOverWeekChange: 3,
    pillarsOnTrack,
    pillarsAtRisk,
    pillarsOffTrack,
    activeCommitments,
    metricsImproved,
    metricsDeclined,
  };
}

async function generateMetricsToReview(
  pillarsWithScores: PillarWithScore[],
  weekOf: string
): Promise<MetricReviewItem[]> {
  const supabase = createClient();
  const reviewItems: MetricReviewItem[] = [];

  // First check if we have existing reviews for this week
  const { data: existingReviews } = await supabase
    .from('metric_reviews')
    .select('metric_id, status')
    .eq('week_of', weekOf);

  const existingReviewMap = new Map(existingReviews?.map((r) => [r.metric_id, r.status]) || []);

  for (const pillar of pillarsWithScores) {
    for (const metric of pillar.metrics) {
      if (metric.status === 'red' || metric.status === 'yellow') {
        reviewItems.push({
          id: `review-${metric.id}-${weekOf}`,
          metricId: metric.id,
          metric,
          pillarId: pillar.id,
          pillarName: pillar.name,
          status: existingReviewMap.get(metric.id) || 'pending',
          weekOf,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  return reviewItems;
}

// ==================== Narratives ====================

export async function createNarrative(data: {
  metricId: string;
  executiveId: string;
  content: string;
}) {
  const supabase = await createClient();
  return await supabase
    .from('narratives')
    .insert({
      metric_id: data.metricId,
      executive_id: data.executiveId,
      content: data.content,
    })
    .select()
    .single();
}

export async function updateNarrative(id: string, content: string) {
  const supabase = await createClient();
  return await supabase
    .from('narratives')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteNarrative(id: string) {
  const supabase = await createClient();
  return await supabase.from('narratives').delete().eq('id', id);
}

// ==================== Commitments ====================

export async function createCommitment(data: {
  metricId: string;
  executiveId: string;
  title: string;
  description?: string;
  targetDate?: string;
}) {
  const supabase = await createClient();
  return await supabase
    .from('commitments')
    .insert({
      metric_id: data.metricId,
      executive_id: data.executiveId,
      title: data.title,
      description: data.description,
      target_date: data.targetDate,
      status: 'pending',
    })
    .select()
    .single();
}

export async function updateCommitment(
  id: string,
  updates: {
    title?: string;
    description?: string;
    status?: string;
    targetDate?: string;
  }
) {
  const supabase = await createClient();
  const updateData: any = { updated_at: new Date().toISOString() };

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;

  return await supabase
    .from('commitments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
}

export async function deleteCommitment(id: string) {
  const supabase = await createClient();
  return await supabase.from('commitments').delete().eq('id', id);
}

// ==================== Commitment Updates ====================

export async function createCommitmentUpdate(data: {
  commitmentId: string;
  executiveId: string;
  content: string;
}) {
  const supabase = await createClient();
  return await supabase
    .from('commitment_updates')
    .insert({
      commitment_id: data.commitmentId,
      executive_id: data.executiveId,
      content: data.content,
    })
    .select()
    .single();
}

// ==================== Metric Detail ====================

export async function getMetricDetail(metricId: string) {
  const supabase = await createClient();

  const { data: metric, error } = await supabase
    .from('metrics')
    .select(`
      *,
      pillar:pillars(*),
      owners:metric_owners(executive:executives(*)),
      narratives(*, executive:executives(*)),
      commitments(
        *,
        executive:executives(*),
        updates:commitment_updates(*, executive:executives(*))
      ),
      history:metric_history(*)
    `)
    .eq('id', metricId)
    .single();

  if (error) {
    console.error('[getMetricDetail] Error fetching metric:', error);
    return null;
  }

  // Sort the nested arrays in JavaScript since Supabase ordering on nested relations can be problematic
  if (metric) {
    if (metric.narratives) {
      metric.narratives.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    if (metric.commitments) {
      metric.commitments.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      // Sort updates within each commitment
      metric.commitments.forEach((commitment: any) => {
        if (commitment.updates) {
          commitment.updates.sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
      });
    }
  }

  return metric;
}
