'use client';

import { TrendDirection } from '@/types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export interface TrendIndicatorProps {
  direction: TrendDirection;
  value?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isPositive?: boolean; // Override: true = green, false = red, undefined = based on direction
}

export function TrendIndicator({ direction, value, showValue = true, size = 'md', isPositive }: TrendIndicatorProps) {
  const getColor = () => {
    // If isPositive is explicitly set, use that for coloring
    if (isPositive !== undefined) {
      if (direction === 'flat') return '#667085';
      return isPositive ? '#12B76A' : '#F04438';
    }
    // Default behavior: up is green, down is red
    switch (direction) {
      case 'up':
        return '#12B76A';
      case 'down':
        return '#F04438';
      case 'flat':
        return '#667085';
    }
  };

  const getIcon = () => {
    const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;
    const color = getColor();

    switch (direction) {
      case 'up':
        return <ArrowUp size={iconSize} color={color} />;
      case 'down':
        return <ArrowDown size={iconSize} color={color} />;
      case 'flat':
        return <Minus size={iconSize} color={color} />;
    }
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-medium ${textSizeClasses[size]}`}
      style={{ color: getColor() }}
    >
      {getIcon()}
      {showValue && value !== undefined && (
        <span>{Math.abs(value)}%</span>
      )}
    </span>
  );
}
