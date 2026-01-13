-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pillars table
CREATE TABLE pillars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_thresholds JSONB NOT NULL DEFAULT '{"green": 90, "yellow": 70}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executives table
CREATE TABLE executives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  headshot_url TEXT,
  email VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executive weekly reports
CREATE TABLE executive_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  week_of DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(executive_id, week_of)
);

-- Metrics table
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id UUID NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  data_source VARCHAR(50) NOT NULL DEFAULT 'manual',
  api_config JSONB DEFAULT '{}',
  target_value NUMERIC NOT NULL DEFAULT 0,
  warning_threshold NUMERIC NOT NULL DEFAULT 70,
  critical_threshold NUMERIC NOT NULL DEFAULT 50,
  current_value NUMERIC NOT NULL DEFAULT 0,
  previous_value NUMERIC,
  trend_direction VARCHAR(10) DEFAULT 'flat',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metric_type VARCHAR(50) NOT NULL DEFAULT 'key_result',
  parent_metric_id UUID REFERENCES metrics(id) ON DELETE SET NULL,
  unit VARCHAR(50),
  format VARCHAR(20) DEFAULT 'number',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metric owners (many-to-many relationship)
CREATE TABLE metric_owners (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  PRIMARY KEY (metric_id, executive_id)
);

-- Metric history for trend charts
CREATE TABLE metric_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commitments table
CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  target_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commitment updates (comments/dialog)
CREATE TABLE commitment_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Narratives for metrics
CREATE TABLE narratives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly snapshots (for historical viewing)
CREATE TABLE weekly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_of DATE NOT NULL UNIQUE,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Improved metrics tracking (when a metric transitions from red/yellow to green)
CREATE TABLE metric_improvements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  previous_status VARCHAR(10) NOT NULL,
  new_status VARCHAR(10) NOT NULL DEFAULT 'green',
  improved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_of DATE NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_metrics_pillar_id ON metrics(pillar_id);
CREATE INDEX idx_metrics_parent_metric_id ON metrics(parent_metric_id);
CREATE INDEX idx_metric_history_metric_id ON metric_history(metric_id);
CREATE INDEX idx_metric_history_recorded_at ON metric_history(recorded_at);
CREATE INDEX idx_commitments_executive_id ON commitments(executive_id);
CREATE INDEX idx_commitments_metric_id ON commitments(metric_id);
CREATE INDEX idx_commitments_status ON commitments(status);
CREATE INDEX idx_commitment_updates_commitment_id ON commitment_updates(commitment_id);
CREATE INDEX idx_narratives_metric_id ON narratives(metric_id);
CREATE INDEX idx_weekly_snapshots_week_of ON weekly_snapshots(week_of);
CREATE INDEX idx_executive_reports_week_of ON executive_reports(week_of);
CREATE INDEX idx_metric_improvements_week_of ON metric_improvements(week_of);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_pillars_updated_at BEFORE UPDATE ON pillars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_executives_updated_at BEFORE UPDATE ON executives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_narratives_updated_at BEFORE UPDATE ON narratives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_executive_reports_updated_at BEFORE UPDATE ON executive_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
