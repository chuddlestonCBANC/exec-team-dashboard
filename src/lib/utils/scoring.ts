import { MetricStatus, Thresholds, Metric, TrendDirection, ComparisonMode, TimePeriod } from '@/types';
import { differenceInDays, startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfWeek, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';

export function getMetricStatus(
  currentValue: number,
  targetValue: number,
  thresholds: Thresholds = { green: 90, yellow: 70 },
  comparisonMode: ComparisonMode = 'at_or_above'
): MetricStatus {
  if (targetValue === 0) return 'yellow';

  switch (comparisonMode) {
    case 'at_or_above':
      // Higher is better - compare current to target as percentage
      return getStatusFromPercentage((currentValue / targetValue) * 100, thresholds);

    case 'at_or_below':
      // Lower is better - invert the comparison
      // If current is at or below target, that's 100%+ "good"
      // If current is above target, calculate how far over we are
      if (currentValue <= targetValue) {
        return 'green';
      }
      const overagePercent = ((currentValue - targetValue) / targetValue) * 100;
      if (overagePercent <= (100 - thresholds.green)) return 'yellow';
      return 'red';

    case 'on_track':
      // Check if we're on pace to hit the target by end of period
      // This requires knowing what % of the period has elapsed
      return getStatusFromPercentage((currentValue / targetValue) * 100, thresholds);

    case 'exact':
      // Must be exactly at target (with some tolerance)
      const variance = Math.abs(currentValue - targetValue) / targetValue * 100;
      if (variance <= 5) return 'green';
      if (variance <= 15) return 'yellow';
      return 'red';

    default:
      return getStatusFromPercentage((currentValue / targetValue) * 100, thresholds);
  }
}

function getStatusFromPercentage(percentage: number, thresholds: Thresholds): MetricStatus {
  if (percentage >= thresholds.green) return 'green';
  if (percentage >= thresholds.yellow) return 'yellow';
  return 'red';
}

// Calculate status for "on_track" metrics based on period progress
export function getOnTrackStatus(
  currentValue: number,
  targetValue: number,
  cadence: TimePeriod,
  thresholds: Thresholds = { green: 90, yellow: 70 }
): MetricStatus {
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  switch (cadence) {
    case 'weekly':
      periodStart = startOfWeek(now, { weekStartsOn: 1 });
      periodEnd = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
      break;
    case 'quarterly':
      periodStart = startOfQuarter(now);
      periodEnd = endOfQuarter(now);
      break;
    case 'annual':
      periodStart = startOfYear(now);
      periodEnd = endOfYear(now);
      break;
  }

  const totalDays = differenceInDays(periodEnd, periodStart) + 1;
  const daysElapsed = differenceInDays(now, periodStart) + 1;
  const percentOfPeriodElapsed = daysElapsed / totalDays;

  // Expected value at this point in the period
  const expectedValue = targetValue * percentOfPeriodElapsed;

  // How we're doing vs expected
  const pacePercentage = expectedValue > 0 ? (currentValue / expectedValue) * 100 : 100;

  return getStatusFromPercentage(pacePercentage, thresholds);
}

export function getPercentageOfTarget(currentValue: number, targetValue: number): number {
  if (targetValue === 0) return 0;
  return Math.round((currentValue / targetValue) * 100);
}

export function getPillarScore(metrics: Metric[]): number {
  if (metrics.length === 0) return 0;

  const totalPercentage = metrics.reduce((sum, metric) => {
    return sum + getPercentageOfTarget(metric.currentValue, metric.targetValue);
  }, 0);

  return Math.round(totalPercentage / metrics.length);
}

export function getTrendDirection(current: number, previous: number | undefined): TrendDirection {
  if (previous === undefined) return 'flat';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

export function getStatusColor(status: MetricStatus): string {
  switch (status) {
    case 'green':
      return '#12B76A';
    case 'yellow':
      return '#F79009';
    case 'red':
      return '#F04438';
    default:
      return '#667085';
  }
}

export function getStatusBgColor(status: MetricStatus): string {
  switch (status) {
    case 'green':
      return '#ECFDF3';
    case 'yellow':
      return '#FFFAEB';
    case 'red':
      return '#FEF3F2';
    default:
      return '#F2F4F7';
  }
}

export function getStatusLabel(status: MetricStatus): string {
  switch (status) {
    case 'green':
      return 'On Track';
    case 'yellow':
      return 'At Risk';
    case 'red':
      return 'Off Track';
    default:
      return 'Unknown';
  }
}

export function getTrendIcon(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'flat':
      return '→';
    default:
      return '→';
  }
}

export function calculatePillarStatus(score: number, thresholds: Thresholds): MetricStatus {
  if (score >= thresholds.green) return 'green';
  if (score >= thresholds.yellow) return 'yellow';
  return 'red';
}

export function getComparisonModeLabel(mode: ComparisonMode): string {
  switch (mode) {
    case 'on_track':
      return 'On Track to Goal';
    case 'at_or_above':
      return 'At or Above Target';
    case 'at_or_below':
      return 'At or Below Target';
    case 'exact':
      return 'Exactly at Target';
    default:
      return 'Unknown';
  }
}

export function getComparisonModeDescription(mode: ComparisonMode): string {
  switch (mode) {
    case 'on_track':
      return 'Cumulative progress toward end-of-period goal (e.g., "15 new customers by EOQ")';
    case 'at_or_above':
      return 'Value should stay at or above target (e.g., "95% retention rate")';
    case 'at_or_below':
      return 'Value should stay at or below target (e.g., "< 3 day resolution time")';
    case 'exact':
      return 'Value should be exactly at target (rare, for specific SLAs)';
    default:
      return '';
  }
}

// Determine if an increase in value is good or bad based on comparison mode
export function isTrendPositive(direction: TrendDirection, comparisonMode: ComparisonMode): boolean {
  if (direction === 'flat') return true;

  switch (comparisonMode) {
    case 'at_or_above':
    case 'on_track':
      return direction === 'up';
    case 'at_or_below':
      return direction === 'down';
    case 'exact':
      return false; // Any movement away is not great
    default:
      return direction === 'up';
  }
}
