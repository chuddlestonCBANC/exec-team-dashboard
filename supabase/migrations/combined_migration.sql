-- Combined migration file for Supabase SQL Editor
-- Run this in the Supabase Dashboard > SQL Editor

-- ============================================
-- PART 1: Initial Schema (001_initial_schema.sql)
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Pillars table
CREATE TABLE IF NOT EXISTS pillars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_thresholds JSONB NOT NULL DEFAULT '{"green": 90, "yellow": 70}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executives table
CREATE TABLE IF NOT EXISTS executives (
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
CREATE TABLE IF NOT EXISTS executive_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  week_of DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(executive_id, week_of)
);

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
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
CREATE TABLE IF NOT EXISTS metric_owners (
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  PRIMARY KEY (metric_id, executive_id)
);

-- Metric history for trend charts
CREATE TABLE IF NOT EXISTS metric_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commitments table
CREATE TABLE IF NOT EXISTS commitments (
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
CREATE TABLE IF NOT EXISTS commitment_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Narratives for metrics
CREATE TABLE IF NOT EXISTS narratives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly snapshots (for historical viewing)
CREATE TABLE IF NOT EXISTS weekly_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_of DATE NOT NULL UNIQUE,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Improved metrics tracking (when a metric transitions from red/yellow to green)
CREATE TABLE IF NOT EXISTS metric_improvements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  executive_id UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  previous_status VARCHAR(10) NOT NULL,
  new_status VARCHAR(10) NOT NULL DEFAULT 'green',
  improved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_of DATE NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_metrics_pillar_id ON metrics(pillar_id);
CREATE INDEX IF NOT EXISTS idx_metrics_parent_metric_id ON metrics(parent_metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_history_metric_id ON metric_history(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_history_recorded_at ON metric_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_commitments_executive_id ON commitments(executive_id);
CREATE INDEX IF NOT EXISTS idx_commitments_metric_id ON commitments(metric_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitment_updates_commitment_id ON commitment_updates(commitment_id);
CREATE INDEX IF NOT EXISTS idx_narratives_metric_id ON narratives(metric_id);
CREATE INDEX IF NOT EXISTS idx_weekly_snapshots_week_of ON weekly_snapshots(week_of);
CREATE INDEX IF NOT EXISTS idx_executive_reports_week_of ON executive_reports(week_of);
CREATE INDEX IF NOT EXISTS idx_metric_improvements_week_of ON metric_improvements(week_of);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers (drop first if exists to avoid errors)
DROP TRIGGER IF EXISTS update_pillars_updated_at ON pillars;
CREATE TRIGGER update_pillars_updated_at BEFORE UPDATE ON pillars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_executives_updated_at ON executives;
CREATE TRIGGER update_executives_updated_at BEFORE UPDATE ON executives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_metrics_updated_at ON metrics;
CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commitments_updated_at ON commitments;
CREATE TRIGGER update_commitments_updated_at BEFORE UPDATE ON commitments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_narratives_updated_at ON narratives;
CREATE TRIGGER update_narratives_updated_at BEFORE UPDATE ON narratives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_executive_reports_updated_at ON executive_reports;
CREATE TRIGGER update_executive_reports_updated_at BEFORE UPDATE ON executive_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- PART 2: New Features (003_new_features.sql)
-- ============================================

-- Talking Items for meetings
CREATE TABLE IF NOT EXISTS talking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  added_by UUID NOT NULL REFERENCES executives(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'discussed', 'deferred')),
  related_metric_id UUID REFERENCES metrics(id) ON DELETE SET NULL,
  related_pillar_id UUID REFERENCES pillars(id) ON DELETE SET NULL,
  week_of DATE NOT NULL,
  discussed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting Notes (Gemini-generated summaries)
CREATE TABLE IF NOT EXISTS meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_of DATE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metric Reviews (for at-risk metrics)
CREATE TABLE IF NOT EXISTS metric_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'deferred', 'commitment_added')),
  deferred_until DATE,
  defer_reason TEXT,
  commitment_id UUID REFERENCES commitments(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES executives(id) ON DELETE SET NULL,
  notes TEXT,
  week_of DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_id, week_of)
);

-- Add comparison_mode and cadence columns to metrics table (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='metrics' AND column_name='comparison_mode') THEN
        ALTER TABLE metrics ADD COLUMN comparison_mode VARCHAR(20) DEFAULT 'at_or_above' CHECK (comparison_mode IN ('on_track', 'at_or_above', 'at_or_below', 'exact'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='metrics' AND column_name='cadence') THEN
        ALTER TABLE metrics ADD COLUMN cadence VARCHAR(20) DEFAULT 'monthly' CHECK (cadence IN ('weekly', 'monthly', 'quarterly', 'annual'));
    END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_talking_items_week_of ON talking_items(week_of);
CREATE INDEX IF NOT EXISTS idx_talking_items_status ON talking_items(status);
CREATE INDEX IF NOT EXISTS idx_talking_items_added_by ON talking_items(added_by);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_week_of ON meeting_notes(week_of);
CREATE INDEX IF NOT EXISTS idx_metric_reviews_week_of ON metric_reviews(week_of);
CREATE INDEX IF NOT EXISTS idx_metric_reviews_status ON metric_reviews(status);
CREATE INDEX IF NOT EXISTS idx_metric_reviews_metric_id ON metric_reviews(metric_id);

-- Apply updated_at triggers for new tables
DROP TRIGGER IF EXISTS update_talking_items_updated_at ON talking_items;
CREATE TRIGGER update_talking_items_updated_at BEFORE UPDATE ON talking_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_notes_updated_at ON meeting_notes;
CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON meeting_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_metric_reviews_updated_at ON metric_reviews;
CREATE TRIGGER update_metric_reviews_updated_at BEFORE UPDATE ON metric_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Schema migration completed successfully! Run seed_data.sql next to add sample data.' as status;
