'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { ValueInputProps, DateOption, DatePlaceholder } from '@/types/integrations';

const DATE_OPTIONS: DateOption[] = [
  { label: 'Current Month Start', value: 'CURRENT_MONTH_START', description: 'First day of current month' },
  { label: 'Current Month End', value: 'CURRENT_MONTH_END', description: 'Last day of current month' },
  { label: 'Current Date', value: 'CURRENT_DATE', description: 'Today\'s date' },
  { label: 'Custom Date...', value: 'custom', description: 'Enter a specific date' },
];

export function ValueInput({ property, operator, values, onChange }: ValueInputProps) {
  // ALL useState hooks must be at the top to avoid hooks order issues
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [customDateValue, setCustomDateValue] = useState('');
  const [tempValue, setTempValue] = useState('');

  if (!property) {
    return (
      <input
        type="text"
        placeholder="Select a property first"
        disabled
        className="px-3 py-2 border border-[var(--gray-200)] rounded-lg bg-[var(--gray-50)] cursor-not-allowed"
      />
    );
  }

  // For NEQ operator, support multiple values
  const isMultiValue = operator === 'neq';

  const handleAddValue = (newValue: string) => {
    if (!newValue.trim()) return;
    if (isMultiValue) {
      if (!values.includes(newValue)) {
        onChange([...values, newValue]);
      }
    } else {
      onChange([newValue]);
    }
  };

  const handleRemoveValue = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleSingleValueChange = (newValue: string) => {
    onChange([newValue]);
  };

  // DATE PROPERTY
  if (property.type === 'date') {
    const currentValue = values[0] || '';
    const isPlaceholder = ['CURRENT_MONTH_START', 'CURRENT_MONTH_END', 'CURRENT_DATE'].includes(currentValue);
    const selectedOption = isPlaceholder ? currentValue : (currentValue ? 'custom' : '');

    return (
      <div className="flex flex-col gap-2">
        <select
          value={selectedOption}
          onChange={(e) => {
            const val = e.target.value as DatePlaceholder;
            if (val === 'custom') {
              setShowCustomDate(true);
              setCustomDateValue(currentValue && !isPlaceholder ? currentValue : '');
            } else {
              setShowCustomDate(false);
              handleSingleValueChange(val);
            }
          }}
          className="px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="">Select date...</option>
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {(showCustomDate || (selectedOption === 'custom' && currentValue)) && (
          <input
            type="date"
            value={customDateValue || currentValue}
            onChange={(e) => {
              setCustomDateValue(e.target.value);
              handleSingleValueChange(e.target.value);
            }}
            className="px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
          />
        )}
      </div>
    );
  }

  // ENUMERATION PROPERTY
  if (property.type === 'enumeration' && property.options) {
    if (isMultiValue) {
      // Multi-select for NEQ
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="flex-1 px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
            >
              <option value="">Select value...</option>
              {property.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (tempValue) {
                  handleAddValue(tempValue);
                  setTempValue('');
                }
              }}
              className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 flex items-center gap-1"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {values.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {values.map((val, index) => {
                const option = property.options?.find(o => o.value === val);
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--gray-100)] text-sm rounded-md"
                  >
                    {option?.label || val}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(index)}
                      className="hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      // Single select
      return (
        <select
          value={values[0] || ''}
          onChange={(e) => handleSingleValueChange(e.target.value)}
          className="px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="">Select value...</option>
          {property.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }
  }

  // NUMBER PROPERTY
  if (property.type === 'number') {
    if (isMultiValue) {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="number"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder="Enter number"
              className="flex-1 px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
            />
            <button
              type="button"
              onClick={() => {
                if (tempValue) {
                  handleAddValue(tempValue);
                  setTempValue('');
                }
              }}
              className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 flex items-center gap-1"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {values.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {values.map((val, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--gray-100)] text-sm rounded-md"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => handleRemoveValue(index)}
                    className="hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <input
          type="number"
          value={values[0] || ''}
          onChange={(e) => handleSingleValueChange(e.target.value)}
          placeholder="Enter number"
          className="px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
        />
      );
    }
  }

  // STRING PROPERTY (default)
  if (isMultiValue) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Enter value"
            className="flex-1 px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tempValue) {
                e.preventDefault();
                handleAddValue(tempValue);
                setTempValue('');
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (tempValue) {
                handleAddValue(tempValue);
                setTempValue('');
              }
            }}
            className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 flex items-center gap-1"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        {values.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {values.map((val, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--gray-100)] text-sm rounded-md"
              >
                {val}
                <button
                  type="button"
                  onClick={() => handleRemoveValue(index)}
                  className="hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <input
        type="text"
        value={values[0] || ''}
        onChange={(e) => handleSingleValueChange(e.target.value)}
        placeholder="Enter value"
        className="px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)]"
      />
    );
  }
}
