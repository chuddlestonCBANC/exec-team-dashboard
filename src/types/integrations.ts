// HubSpot property metadata from API
export interface HubSpotProperty {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'enumeration';
  fieldType: string;
  options?: Array<{ label: string; value: string }>;
}

// HubSpot object type metadata
export interface HubSpotObjectType {
  id: string;
  label: string;
  description?: string;
}

// Filter condition for building queries
export interface FilterCondition {
  id: string;
  property: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
  values: string[];
}

// Props for the main filter builder component
export interface FilterBuilderProps {
  value: string; // JSON string from formData.integrationQuery
  onChange: (value: string) => void;
}

// Props for a single filter row
export interface FilterRowProps {
  condition: FilterCondition;
  properties: HubSpotProperty[];
  onChange: (condition: FilterCondition) => void;
  onRemove: () => void;
}

// Props for the value input component
export interface ValueInputProps {
  property: HubSpotProperty | undefined;
  operator: FilterCondition['operator'];
  values: string[];
  onChange: (values: string[]) => void;
}

// Date placeholder options
export type DatePlaceholder =
  | 'CURRENT_MONTH_START'
  | 'CURRENT_MONTH_END'
  | 'CURRENT_DATE'
  | 'custom';

export interface DateOption {
  label: string;
  value: DatePlaceholder;
  description?: string;
}
