-- Migration: Query-Based Integrations
-- Update integration mappings to use flexible queries instead of hardcoded field paths

-- Drop the old external_field_path column and add query-based columns
ALTER TABLE integration_mappings
  DROP COLUMN IF EXISTS external_field_path CASCADE;

ALTER TABLE integration_mappings
  ADD COLUMN IF NOT EXISTS query TEXT NOT NULL DEFAULT '', -- JQL query for Jira, filter criteria for HubSpot
  ADD COLUMN IF NOT EXISTS aggregation_method VARCHAR(50) DEFAULT 'sum', -- sum, count, average, max, min
  ADD COLUMN IF NOT EXISTS value_field VARCHAR(255), -- Which field to aggregate (e.g., 'storyPoints', 'amount')
  ADD COLUMN IF NOT EXISTS description TEXT; -- Human-readable description of what this mapping does

-- Add a comment explaining the query format
COMMENT ON COLUMN integration_mappings.query IS
'For Jira: JQL query (e.g., "project = PROJ AND sprint = currentSprint() AND status = Done")
For HubSpot: Search criteria as JSON (e.g., {"dealstage": "closedwon", "closedate": {"gte": "2024-01-01"}})';

-- Example: Sprint velocity mapping
-- query: "project = PROJ AND sprint in closedSprints() ORDER BY sprint DESC"
-- aggregation_method: "sum"
-- value_field: "storyPoints"

-- Example: Revenue mapping
-- query: '{"dealstage": "closedwon", "closedate": {"gte": "CURRENT_MONTH"}}'
-- aggregation_method: "sum"
-- value_field: "amount"

SELECT 'Query-based integrations migration completed!' as status;
