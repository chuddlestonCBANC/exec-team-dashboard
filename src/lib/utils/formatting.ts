import { format, startOfWeek, endOfWeek, parseISO, isThisWeek, subWeeks, addWeeks } from 'date-fns';
import { WeekInfo } from '@/types';

export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

export function formatMetricValue(value: number, formatType?: 'number' | 'currency' | 'percentage'): string {
  switch (formatType) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    default:
      return formatNumber(value);
  }
}

export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy');
}

export function formatDateTime(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateString: string): string {
  const date = parseISO(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return formatDate(dateString);
}

export function getWeekLabel(weekOf: string): string {
  const date = parseISO(weekOf);
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
}

export function getCurrentWeekOf(): string {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

export function getWeekOfDate(date: Date): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

export function getWeeksRange(weeksBack: number = 12): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const now = new Date();

  for (let i = 0; i < weeksBack; i++) {
    const weekDate = subWeeks(now, i);
    const weekOf = getWeekOfDate(weekDate);

    weeks.push({
      weekOf,
      label: getWeekLabel(weekOf),
      isCurrentWeek: i === 0,
    });
  }

  return weeks;
}

export function getPreviousWeekOf(currentWeekOf: string): string {
  const date = parseISO(currentWeekOf);
  const previousWeek = subWeeks(date, 1);
  return format(startOfWeek(previousWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getNextWeekOf(currentWeekOf: string): string {
  const date = parseISO(currentWeekOf);
  const nextWeek = addWeeks(date, 1);
  return format(startOfWeek(nextWeek, { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function isCurrentWeek(weekOf: string): boolean {
  const date = parseISO(weekOf);
  return isThisWeek(date, { weekStartsOn: 1 });
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
