'use client';

import { Trash2 } from 'lucide-react';
import { ValueInput } from './ValueInput';
import type { FilterRowProps } from '@/types/integrations';

// Operator labels for display
const OPERATOR_LABELS = {
  eq: 'equals',
  neq: 'not equals',
  gt: 'greater than',
  gte: 'greater than or equal',
  lt: 'less than',
  lte: 'less than or equal',
};

export function FilterRow({ condition, properties, onChange, onRemove }: FilterRowProps) {
  const selectedProperty = properties.find(p => p.name === condition.property);

  // Get available operators based on property type
  const getOperatorsForType = (type: string | undefined) => {
    if (!type) return ['eq', 'neq'];

    switch (type) {
      case 'date':
      case 'number':
        return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
      case 'string':
      case 'enumeration':
      default:
        return ['eq', 'neq'];
    }
  };

  const availableOperators = getOperatorsForType(selectedProperty?.type);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_150px_1fr_auto] gap-2 items-start p-3 bg-[var(--gray-50)] rounded-lg border border-[var(--gray-200)]">
      {/* Property Selector */}
      <div>
        <select
          value={condition.property}
          onChange={(e) => {
            onChange({
              ...condition,
              property: e.target.value,
              // Reset operator if not valid for new property type
              operator: availableOperators.includes(condition.operator) ? condition.operator : 'eq',
              // Reset values when property changes
              values: [],
            });
          }}
          className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] bg-white"
        >
          <option value="">Select property...</option>
          {properties.map((prop) => (
            <option key={prop.name} value={prop.name}>
              {prop.label}
            </option>
          ))}
        </select>
      </div>

      {/* Operator Selector */}
      <div>
        <select
          value={condition.operator}
          onChange={(e) => {
            const newOperator = e.target.value as any;
            const wasMultiValue = condition.operator === 'neq';
            const isMultiValue = newOperator === 'neq';

            // Only reset values if switching between multi and single value modes
            let newValues = condition.values;
            if (wasMultiValue && !isMultiValue && condition.values.length > 1) {
              // Switching from NEQ (multi) to single-value operator - keep only first value
              newValues = [condition.values[0]];
            }

            onChange({
              ...condition,
              operator: newOperator,
              values: newValues,
            });
          }}
          disabled={!condition.property}
          className="w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] bg-white disabled:bg-[var(--gray-100)] disabled:cursor-not-allowed"
        >
          {availableOperators.map((op) => (
            <option key={op} value={op}>
              {OPERATOR_LABELS[op as keyof typeof OPERATOR_LABELS]}
            </option>
          ))}
        </select>
      </div>

      {/* Value Input */}
      <div>
        <ValueInput
          property={selectedProperty}
          operator={condition.operator}
          values={condition.values}
          onChange={(newValues) => {
            onChange({
              ...condition,
              values: newValues,
            });
          }}
        />
      </div>

      {/* Remove Button */}
      <div>
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-[var(--gray-500)] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Remove filter"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
