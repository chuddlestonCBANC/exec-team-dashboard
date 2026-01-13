-- Migration: Overview Reports
-- Allow executives to write weekly overview/narrative content for the dashboard

CREATE TABLE IF NOT EXISTS overview_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_of DATE NOT NULL, -- The Monday of the week this report is for
  author_id UUID REFERENCES executives(id) ON DELETE SET NULL, -- Executive who wrote this
  narrative TEXT NOT NULL, -- Main narrative/summary text
  highlights TEXT[], -- Array of highlight bullet points
  concerns TEXT[], -- Array of concern/focus area bullet points
  is_published BOOLEAN NOT NULL DEFAULT false, -- Draft vs published state
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE -- When it was published
);

-- Only one report per week
CREATE UNIQUE INDEX IF NOT EXISTS idx_overview_reports_week_of ON overview_reports(week_of);

-- Index for author lookups
CREATE INDEX IF NOT EXISTS idx_overview_reports_author ON overview_reports(author_id);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS update_overview_reports_updated_at ON overview_reports;
CREATE TRIGGER update_overview_reports_updated_at BEFORE UPDATE ON overview_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample overview report for current week
-- Get the Monday of the current week
DO $$
DECLARE
  current_week DATE := DATE_TRUNC('week', CURRENT_DATE)::DATE;
  ceo_id UUID;
BEGIN
  -- Get Hank's ID (CEO) as the author
  SELECT id INTO ceo_id FROM executives WHERE title ILIKE '%CEO%' LIMIT 1;

  -- Only insert if we have a CEO
  IF ceo_id IS NOT NULL THEN
    INSERT INTO overview_reports (week_of, author_id, narrative, highlights, concerns, is_published, published_at)
    VALUES (
      current_week,
      ceo_id,
      'This week marks a significant milestone in our Q1 execution. The team has demonstrated exceptional focus on our core strategic initiatives, with notable progress across all four pillars.

Our revenue pipeline continues to strengthen, with several key enterprise deals advancing to final negotiations. The sales team has exceeded their weekly activity targets, and our marketing campaigns are generating strong qualified leads.

On the product front, we successfully shipped the new analytics dashboard feature, which has already received positive feedback from beta customers. Engineering velocity remains high, with sprint commitments being met consistently.

Looking ahead, we need to maintain this momentum while addressing the capacity constraints in our customer success organization. The team is working on a hiring plan to ensure we can properly support our growing customer base.',
      ARRAY[
        'Pipeline value increased by 15% week-over-week, driven by strong enterprise momentum',
        'Product team shipped analytics dashboard on schedule with positive customer feedback',
        'Customer retention rate remains above 95% target for the third consecutive week'
      ],
      ARRAY[
        'Customer success team capacity is at 95% - need to accelerate hiring',
        'Two key deals slipped from this week to next due to procurement delays',
        'Engineering technical debt backlog growing - need to allocate sprint capacity'
      ],
      true,
      NOW()
    )
    ON CONFLICT (week_of) DO UPDATE SET
      narrative = EXCLUDED.narrative,
      highlights = EXCLUDED.highlights,
      concerns = EXCLUDED.concerns,
      is_published = EXCLUDED.is_published,
      published_at = EXCLUDED.published_at;
  END IF;
END $$;

SELECT 'Overview reports migration completed successfully!' as status;
