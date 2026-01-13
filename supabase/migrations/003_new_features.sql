-- Add new tables for talking items, meeting notes, and metric reviews

-- Talking Items for meetings
CREATE TABLE talking_items (
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
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_of DATE NOT NULL UNIQUE,
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metric Reviews (for at-risk metrics)
CREATE TABLE metric_reviews (
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

-- Add comparison_mode and cadence columns to metrics table
ALTER TABLE metrics
ADD COLUMN IF NOT EXISTS comparison_mode VARCHAR(20) DEFAULT 'at_or_above' CHECK (comparison_mode IN ('on_track', 'at_or_above', 'at_or_below', 'exact')),
ADD COLUMN IF NOT EXISTS cadence VARCHAR(20) DEFAULT 'monthly' CHECK (cadence IN ('weekly', 'monthly', 'quarterly', 'annual'));

-- Create indexes
CREATE INDEX idx_talking_items_week_of ON talking_items(week_of);
CREATE INDEX idx_talking_items_status ON talking_items(status);
CREATE INDEX idx_talking_items_added_by ON talking_items(added_by);
CREATE INDEX idx_meeting_notes_week_of ON meeting_notes(week_of);
CREATE INDEX idx_metric_reviews_week_of ON metric_reviews(week_of);
CREATE INDEX idx_metric_reviews_status ON metric_reviews(status);
CREATE INDEX idx_metric_reviews_metric_id ON metric_reviews(metric_id);

-- Apply updated_at triggers
CREATE TRIGGER update_talking_items_updated_at BEFORE UPDATE ON talking_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meeting_notes_updated_at BEFORE UPDATE ON meeting_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metric_reviews_updated_at BEFORE UPDATE ON metric_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
