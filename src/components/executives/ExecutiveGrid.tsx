'use client';

import { ExecutiveWithDetails } from '@/types';
import { ExecutiveCard } from './ExecutiveCard';

interface ExecutiveGridProps {
  executives: ExecutiveWithDetails[];
}

export function ExecutiveGrid({ executives }: ExecutiveGridProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--gray-800)]">
        Executive Reports
      </h2>
      <div className="space-y-4">
        {executives.map((executive) => (
          <ExecutiveCard key={executive.id} executive={executive} />
        ))}
      </div>
    </div>
  );
}
