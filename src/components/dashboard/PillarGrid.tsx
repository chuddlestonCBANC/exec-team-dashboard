'use client';

import { PillarWithScore } from '@/types';
import { PillarCard } from './PillarCard';

interface PillarGridProps {
  pillars: PillarWithScore[];
}

export function PillarGrid({ pillars }: PillarGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {pillars.map((pillar) => (
        <PillarCard key={pillar.id} pillar={pillar} />
      ))}
    </div>
  );
}
