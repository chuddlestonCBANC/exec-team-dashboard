# Integration Setup Guide

The executive dashboard supports flexible, query-based integrations with Jira and HubSpot. Instead of hardcoded field mappings, you can define custom queries to pull exactly the data you need.

## Setup Overview

1. **Connect** your integration (Jira or HubSpot)
2. **Create mappings** that link metrics to queries
3. **Sync** data manually or on a schedule

## Jira Integration

### 1. Connect Jira

In the Admin panel → Integrations tab:
- **Jira Host**: `yourcompany.atlassian.net` (no https://)
- **Email**: Your Atlassian account email
- **API Token**: [Generate one here](https://id.atlassian.com/manage-profile/security/api-tokens)

### 2. Create Query Mappings

Add entries to the `integration_mappings` table:

```sql
INSERT INTO integration_mappings (
  integration_id,
  metric_id,
  query,
  aggregation_method,
  value_field,
  description
) VALUES (
  '<integration_id>',
  '<metric_id>',
  'project = PROJ AND sprint in closedSprints() ORDER BY created DESC LIMIT 1',
  'sum',
  'storyPoints',
  'Sprint velocity - story points completed in last sprint'
);
```

### Example JQL Queries

**Sprint Velocity (Story Points):**
```sql
query: 'project = PROJ AND sprint in closedSprints() AND status = Done'
aggregation_method: 'sum'
value_field: 'storyPoints'
```

**Bugs Created This Month:**
```sql
query: 'project = PROJ AND issuetype = Bug AND created >= startOfMonth()'
aggregation_method: 'count'
value_field: null  -- count doesn't need a field
```

**Average Cycle Time:**
```sql
query: 'project = PROJ AND resolved >= startOfWeek() AND resolved <= endOfWeek()'
aggregation_method: 'average'
value_field: 'timespent'  -- in seconds
```

**P0/P1 Issues Open:**
```sql
query: 'project = PROJ AND status != Done AND priority in (Highest, High)'
aggregation_method: 'count'
```

### Supported Aggregation Methods
- `count` - Count matching issues
- `sum` - Sum a numeric field
- `average` - Average a numeric field
- `max` - Maximum value
- `min` - Minimum value

### Common Field Names
- `storyPoints` - Story points (auto-maps to customfield_10016)
- `timespent` - Time spent in seconds
- Any custom field: `customfield_xxxxx`

## HubSpot Integration

### 1. Connect HubSpot

In the Admin panel → Integrations tab:
- **API Key**: Your HubSpot API key OR
- **Access Token**: OAuth access token

### 2. Create Query Mappings

HubSpot queries use JSON format:

```sql
INSERT INTO integration_mappings (
  integration_id,
  metric_id,
  query,
  aggregation_method,
  value_field,
  description
) VALUES (
  '<integration_id>',
  '<metric_id>',
  '{"_objectType": "deals", "dealstage": "closedwon", "closedate": {"gte": "CURRENT_MONTH"}}',
  'sum',
  'amount',
  'Revenue closed this month'
);
```

### Example HubSpot Queries

**Monthly Revenue:**
```json
{
  "_objectType": "deals",
  "dealstage": "closedwon",
  "closedate": {"gte": "2024-01-01", "lte": "2024-01-31"}
}
aggregation_method: 'sum'
value_field: 'amount'
```

**New Leads This Month:**
```json
{
  "_objectType": "contacts",
  "createdate": {"gte": "2024-01-01"}
}
aggregation_method: 'count'
```

**Pipeline Value:**
```json
{
  "_objectType": "deals",
  "dealstage": {"neq": "closedwon"},
  "dealstage": {"neq": "closedlost"}
}
aggregation_method: 'sum'
value_field: 'amount'
```

**Average Deal Size:**
```json
{
  "_objectType": "deals",
  "dealstage": "closedwon"
}
aggregation_method: 'average'
value_field: 'amount'
```

### Query Format

HubSpot queries support:
- `_objectType`: `"deals"`, `"contacts"`, or `"companies"`
- Property filters with operators:
  - Simple: `"dealstage": "closedwon"`
  - Greater than: `"amount": {"gt": 10000}`
  - Less than: `"amount": {"lt": 50000}`
  - Greater/less or equal: `{"gte": value}`, `{"lte": value}`
  - Not equal: `{"neq": value}`

### Date Placeholders
- `CURRENT_MONTH` - First day of current month
- `CURRENT_WEEK` - First day of current week
- `CURRENT_YEAR` - First day of current year

## Transformation Rules

Apply transformations to query results:

```sql
transformation_rules: '{
  "divide": 1000,    -- Convert cents to dollars
  "multiply": 100    -- Convert to percentage
}'
```

## Testing & Syncing

1. **Test Connection**: Use the "Configure" button to test your credentials
2. **Manual Sync**: Click "Sync Now" to pull data immediately
3. **View Logs**: Check `integration_sync_logs` table for sync history

## Example: Complete Setup

### Jira Sprint Velocity

```sql
-- 1. Get your integration ID
SELECT id FROM integrations WHERE type = 'jira';

-- 2. Get your metric ID
SELECT id FROM metrics WHERE name = 'Sprint Velocity';

-- 3. Create the mapping
INSERT INTO integration_mappings (
  integration_id,
  metric_id,
  query,
  aggregation_method,
  value_field,
  description
) VALUES (
  '<jira_integration_id>',
  '<sprint_velocity_metric_id>',
  'project = MYPROJECT AND sprint in closedSprints() ORDER BY created DESC LIMIT 50',
  'sum',
  'storyPoints',
  'Sum of story points in last closed sprint'
);
```

### HubSpot Monthly Revenue

```sql
-- 1. Get your integration ID
SELECT id FROM integrations WHERE type = 'hubspot';

-- 2. Get your metric ID
SELECT id FROM metrics WHERE name = 'Monthly Revenue';

-- 3. Create the mapping
INSERT INTO integration_mappings (
  integration_id,
  metric_id,
  query,
  aggregation_method,
  value_field,
  description,
  transformation_rules
) VALUES (
  '<hubspot_integration_id>',
  '<revenue_metric_id>',
  '{"_objectType": "deals", "dealstage": "closedwon", "closedate": {"gte": "CURRENT_MONTH"}}',
  'sum',
  'amount',
  'Total deal value closed this month',
  '{"divide": 100}'  -- Convert cents to dollars if needed
);
```

## Troubleshooting

- **Connection Failed**: Check credentials and network access
- **No Data Synced**: Verify your query returns results in Jira/HubSpot directly
- **Wrong Values**: Check aggregation method and value_field name
- **Permission Errors**: Ensure API token has read access to required data

## Need Help?

- Jira JQL: [Official Documentation](https://support.atlassian.com/jira-software-cloud/docs/use-advanced-search-with-jira-query-language-jql/)
- HubSpot API: [Search API Documentation](https://developers.hubspot.com/docs/api/crm/search)
