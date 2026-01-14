'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';
import { FilterRow } from './FilterRow';
import type { FilterBuilderProps, FilterCondition, HubSpotProperty, HubSpotObjectType } from '@/types/integrations';

export function HubSpotFilterBuilder({ value, onChange }: FilterBuilderProps) {
  const [objectType, setObjectType] = useState<string>('deals');
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [properties, setProperties] = useState<HubSpotProperty[]>([]);
  const [objectTypes, setObjectTypes] = useState<HubSpotObjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serialize filters to JSON string
  const serializeToJSON = useCallback((filtersArray: FilterCondition[], objType: string): string => {
    if (filtersArray.length === 0) {
      return JSON.stringify({ _objectType: objType });
    }

    const result: Record<string, any> = { _objectType: objType };

    filtersArray.forEach((filter) => {
      if (!filter.property || filter.values.length === 0) return;

      if (filter.operator === 'eq' && filter.values.length === 1) {
        // Simple equality: { "dealstage": "closedwon" }
        result[filter.property] = filter.values[0];
      } else if (filter.values.length === 1) {
        // Single value with operator: { "amount": { "gte": 1000 } }
        result[filter.property] = {
          [filter.operator]: filter.values[0],
        };
      } else {
        // Multiple values (NEQ): { "dealstage": { "neq": ["val1", "val2"] } }
        result[filter.property] = {
          [filter.operator]: filter.values,
        };
      }
    });

    return JSON.stringify(result);
  }, []);

  // Parse JSON string to filters array
  const parseFromJSON = useCallback((jsonString: string): { filters: FilterCondition[]; objectType: string } => {
    try {
      if (!jsonString) {
        return { filters: [], objectType: 'deals' };
      }

      const parsed = JSON.parse(jsonString);
      const objType = parsed._objectType || 'deals';
      const filtersArray: FilterCondition[] = [];

      Object.entries(parsed).forEach(([key, value]) => {
        if (key === '_objectType') return;

        const condition: FilterCondition = {
          id: Math.random().toString(36).substring(7),
          property: key,
          operator: 'eq',
          values: [],
        };

        if (typeof value === 'string' || typeof value === 'number') {
          // Simple value: "dealstage": "closedwon"
          condition.operator = 'eq';
          condition.values = [String(value)];
        } else if (typeof value === 'object' && value !== null) {
          // Operator object: "amount": { "gte": 1000 }
          const [op, val] = Object.entries(value)[0];
          condition.operator = op as any;
          condition.values = Array.isArray(val) ? val.map(String) : [String(val)];
        }

        filtersArray.push(condition);
      });

      return { filters: filtersArray, objectType: objType };
    } catch (err) {
      console.error('[HubSpotFilterBuilder] Error parsing JSON:', err);
      return { filters: [], objectType: 'deals' };
    }
  }, []);

  // Load object types on mount
  useEffect(() => {
    fetch('/api/integrations/hubspot/object-types')
      .then(res => res.json())
      .then(data => {
        setObjectTypes(data.objectTypes || []);
      })
      .catch(err => {
        console.error('[HubSpotFilterBuilder] Error loading object types:', err);
        setError('Failed to load object types');
      });
  }, []);

  // Load properties when object type changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/integrations/hubspot/properties?objectType=${objectType}`)
      .then(res => res.json())
      .then(data => {
        if (data.error && !data.properties) {
          setError(data.error);
        }
        setProperties(data.properties || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('[HubSpotFilterBuilder] Error loading properties:', err);
        setError('Failed to load properties');
        setLoading(false);
      });
  }, [objectType]);

  // Parse incoming value when it changes externally
  useEffect(() => {
    // Only parse if the incoming value is different from our current serialization
    const currentSerialized = serializeToJSON(filters, objectType);
    if (value && value !== currentSerialized) {
      const parsed = parseFromJSON(value);
      setObjectType(parsed.objectType);
      setFilters(parsed.filters);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of changes
  useEffect(() => {
    const json = serializeToJSON(filters, objectType);
    if (json !== value) {
      onChange(json);
    }
  }, [filters, objectType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddFilter = () => {
    const newFilter: FilterCondition = {
      id: Math.random().toString(36).substring(7),
      property: '',
      operator: 'eq',
      values: [],
    };
    setFilters([...filters, newFilter]);
  };

  const handleUpdateFilter = (index: number, updatedFilter: FilterCondition) => {
    const newFilters = [...filters];
    newFilters[index] = updatedFilter;
    setFilters(newFilters);
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Object Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Object Type <span className="text-red-500">*</span>
        </label>
        <select
          value={objectType}
          onChange={(e) => {
            setObjectType(e.target.value);
            // Clear filters when changing object type
            setFilters([]);
          }}
          className="w-full md:w-64 px-3 py-2 border border-[var(--gray-200)] rounded-lg focus:outline-none focus:border-[var(--primary)] bg-white"
        >
          {objectTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--gray-500)] mt-1">
          Select which HubSpot object to query (changing this will clear filters)
        </p>
      </div>

      {/* Filters Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">
            Filters
          </label>
          {filters.length > 0 && (
            <span className="text-xs text-[var(--gray-500)]">
              All filters combined with AND logic
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 p-4 text-[var(--gray-500)]">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading properties...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {!loading && filters.length === 0 && (
          <div className="p-6 border-2 border-dashed border-[var(--gray-200)] rounded-lg text-center text-[var(--gray-500)]">
            <p className="text-sm">No filters added yet.</p>
            <p className="text-xs mt-1">Click "Add Filter" below to create your first filter condition.</p>
          </div>
        )}

        {!loading && filters.length > 0 && (
          <div className="space-y-3">
            {filters.map((filter, index) => (
              <FilterRow
                key={filter.id}
                condition={filter}
                properties={properties}
                onChange={(updated) => handleUpdateFilter(index, updated)}
                onRemove={() => handleRemoveFilter(index)}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddFilter}
          disabled={loading}
          className="mt-3 px-4 py-2 border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Add Filter
        </button>

        <p className="text-xs text-[var(--gray-500)] mt-2">
          Filters are combined with AND logic. For example: dealstage = closedwon AND closedate &gt;= 2024-01-01
        </p>
      </div>

      {/* Preview (for debugging) */}
      {process.env.NODE_ENV === 'development' && filters.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-[var(--gray-500)] hover:text-[var(--gray-700)]">
            Preview JSON Query
          </summary>
          <pre className="mt-2 p-2 bg-[var(--gray-100)] rounded text-xs overflow-x-auto">
            {JSON.stringify(JSON.parse(serializeToJSON(filters, objectType)), null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
