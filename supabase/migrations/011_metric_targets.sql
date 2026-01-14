-- Migration: Add metric_targets table for period-specific targets

CREATE TABLE IF NOT EXISTS metric_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'weekly'
  year INTEGER NOT NULL,
  period_number INTEGER, -- Month (1-12), Quarter (1-4), Week (1-53), NULL for annual
  target_value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_id, period, year, period_number)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_metric_targets_metric_id ON metric_targets(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_targets_period ON metric_targets(period, year, period_number);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_metric_targets_updated_at ON metric_targets;
CREATE TRIGGER update_metric_targets_updated_at
  BEFORE UPDATE ON metric_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE metric_targets IS 'Stores period-specific target values for metrics';
COMMENT ON COLUMN metric_targets.period_number IS 'Month (1-12), Quarter (1-4), Week (1-53), or NULL for annual targets';

SELECT 'Metric targets table created successfully!' as status;
