-- Migration: Add period-specific targets for metrics
-- This allows setting different targets for weekly, monthly, quarterly, and annual periods

-- Create metric_targets table for period-specific goals
CREATE TABLE IF NOT EXISTS metric_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'annual')),
  year INTEGER NOT NULL, -- The year this target applies to (e.g., 2025)
  period_number INTEGER, -- For weekly (1-52), monthly (1-12), quarterly (1-4). NULL for annual.
  target_value NUMERIC NOT NULL,
  warning_threshold NUMERIC DEFAULT 70, -- Percentage where metric turns yellow
  critical_threshold NUMERIC DEFAULT 50, -- Percentage where metric turns red
  notes TEXT, -- Optional notes about this target
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique target per metric/period/year/period_number
  UNIQUE(metric_id, period, year, period_number)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_metric_targets_metric_id ON metric_targets(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_targets_period ON metric_targets(period);
CREATE INDEX IF NOT EXISTS idx_metric_targets_year ON metric_targets(year);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_metric_targets_updated_at ON metric_targets;
CREATE TRIGGER update_metric_targets_updated_at BEFORE UPDATE ON metric_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial targets for existing metrics based on their current target_value
-- This creates annual targets for 2025 based on current values
INSERT INTO metric_targets (metric_id, period, year, period_number, target_value, warning_threshold, critical_threshold)
SELECT
  id as metric_id,
  'annual' as period,
  2025 as year,
  NULL as period_number,
  target_value,
  warning_threshold,
  critical_threshold
FROM metrics
WHERE metric_type = 'key_result'
ON CONFLICT (metric_id, period, year, period_number) DO NOTHING;

-- Also create quarterly targets (Q1-Q4) based on annual targets
INSERT INTO metric_targets (metric_id, period, year, period_number, target_value, warning_threshold, critical_threshold)
SELECT
  id as metric_id,
  'quarterly' as period,
  2025 as year,
  q.quarter as period_number,
  CASE
    -- For cumulative metrics (like "New Customers"), divide annual by 4
    WHEN comparison_mode = 'on_track' THEN ROUND(target_value / 4)
    -- For rate/percentage metrics, keep the same target
    ELSE target_value
  END as target_value,
  warning_threshold,
  critical_threshold
FROM metrics
CROSS JOIN (SELECT generate_series(1, 4) as quarter) q
WHERE metric_type = 'key_result'
ON CONFLICT (metric_id, period, year, period_number) DO NOTHING;

-- Create monthly targets (Jan-Dec) based on annual targets
INSERT INTO metric_targets (metric_id, period, year, period_number, target_value, warning_threshold, critical_threshold)
SELECT
  id as metric_id,
  'monthly' as period,
  2025 as year,
  m.month as period_number,
  CASE
    -- For cumulative metrics, divide annual by 12
    WHEN comparison_mode = 'on_track' THEN ROUND(target_value / 12)
    -- For rate/percentage metrics, keep the same target
    ELSE target_value
  END as target_value,
  warning_threshold,
  critical_threshold
FROM metrics
CROSS JOIN (SELECT generate_series(1, 12) as month) m
WHERE metric_type = 'key_result'
ON CONFLICT (metric_id, period, year, period_number) DO NOTHING;

SELECT 'Metric period targets migration completed successfully!' as status;
