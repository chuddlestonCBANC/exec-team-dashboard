'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MetricHistory } from '@/types';
import { format, parseISO } from 'date-fns';
import { formatMetricValue } from '@/lib/utils/formatting';

interface TrendChartProps {
  history: MetricHistory[];
  targetValue: number;
  format?: 'number' | 'currency' | 'percentage';
  height?: number;
}

export function TrendChart({
  history,
  targetValue,
  format: formatType = 'number',
  height = 200,
}: TrendChartProps) {
  const chartData = useMemo(() => {
    return history
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((h) => ({
        date: format(parseISO(h.recordedAt), 'MMM d'),
        value: h.value,
        fullDate: h.recordedAt,
      }));
  }, [history]);

  const minValue = Math.min(...history.map((h) => h.value), targetValue) * 0.9;
  const maxValue = Math.max(...history.map((h) => h.value), targetValue) * 1.1;

  if (history.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-[var(--gray-50)] rounded-lg"
        style={{ height }}
      >
        <p className="text-sm text-[var(--gray-500)]">No historical data available</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--gray-500)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--gray-200)' }}
          />
          <YAxis
            domain={[minValue, maxValue]}
            tick={{ fontSize: 12, fill: 'var(--gray-500)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--gray-200)' }}
            tickFormatter={(value) => formatMetricValue(value, formatType)}
            width={60}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white border border-[var(--gray-200)] rounded-lg shadow-lg p-3">
                    <p className="text-xs text-[var(--gray-500)]">
                      {format(parseISO(data.fullDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-sm font-semibold text-[var(--gray-800)]">
                      {formatMetricValue(data.value, formatType)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={targetValue}
            stroke="var(--primary)"
            strokeDasharray="5 5"
            label={{
              value: 'Target',
              position: 'right',
              fill: 'var(--primary)',
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 4 }}
            activeDot={{ fill: 'var(--primary)', strokeWidth: 0, r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
