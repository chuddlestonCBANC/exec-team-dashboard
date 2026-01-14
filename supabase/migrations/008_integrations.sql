-- Migration: Data Integrations
-- Add support for HubSpot, Jira, and other third-party integrations

-- Create enum for integration types
DO $$ BEGIN
    CREATE TYPE integration_type AS ENUM ('hubspot', 'jira', 'google_sheets', 'salesforce', 'slack');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create integrations table to store connection settings
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type integration_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}', -- Stores API keys, tokens, instance URLs, etc
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status VARCHAR(50), -- 'success', 'failed', 'in_progress'
  last_sync_error TEXT,
  sync_frequency_minutes INTEGER DEFAULT 60, -- How often to sync
  created_by UUID REFERENCES approved_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(type)
);

-- Create integration_mappings table to map external data to our metrics
CREATE TABLE IF NOT EXISTS integration_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES metrics(id) ON DELETE CASCADE,
  external_field_path VARCHAR(500) NOT NULL, -- JSON path to extract value (e.g., 'deals.amount' for HubSpot)
  transformation_rules JSONB, -- Rules for transforming the data (e.g., divide by 1000, sum, average)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_id, metric_id)
);

-- Create integration_sync_logs table to track sync history
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL, -- 'running', 'success', 'failed'
  records_fetched INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB, -- Additional sync details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(type);
CREATE INDEX IF NOT EXISTS idx_integrations_is_active ON integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integration_mappings_integration ON integration_mappings(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_mappings_metric ON integration_mappings(metric_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_integration ON integration_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_logs_started_at ON integration_sync_logs(started_at);

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_mappings_updated_at ON integration_mappings;
CREATE TRIGGER update_integration_mappings_updated_at BEFORE UPDATE ON integration_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get integration status
CREATE OR REPLACE FUNCTION get_integration_status(integration_type_param integration_type)
RETURNS TABLE (
  is_connected BOOLEAN,
  last_sync TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.is_active,
    i.last_sync_at,
    i.last_sync_status,
    i.last_sync_error
  FROM integrations i
  WHERE i.type = integration_type_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Integrations migration completed successfully!' as status;
