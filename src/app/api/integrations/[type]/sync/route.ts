import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHubSpotClient } from '@/lib/integrations/hubspot';
import { createJiraClient } from '@/lib/integrations/jira';
import { createGoogleSheetsClient } from '@/lib/integrations/sheets';

// POST - Trigger a sync for an integration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const supabase = await createClient();
  const { type } = await params;

  console.log(`[Sync API] Starting sync for ${type}...`);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log(`[Sync API] Unauthorized - no user`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the integration configuration
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .single();

  if (integrationError || !integration) {
    console.log(`[Sync API] Integration not found or not active:`, integrationError);
    return NextResponse.json(
      { error: 'Integration not found or not active' },
      { status: 404 }
    );
  }

  console.log(`[Sync API] Found integration:`, integration.name);

  // Create a sync log entry
  const { data: syncLog, error: logError } = await supabase
    .from('integration_sync_logs')
    .insert({
      integration_id: integration.id,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (logError || !syncLog) {
    return NextResponse.json({ error: 'Failed to create sync log' }, { status: 500 });
  }

  try {
    let recordsFetched = 0;
    let recordsUpdated = 0;

    // Get all mappings for this integration
    const { data: mappings } = await supabase
      .from('integration_mappings')
      .select('*')
      .eq('integration_id', integration.id)
      .eq('is_active', true);

    console.log(`[Sync API] Found ${mappings?.length || 0} active mappings`);

    if (!mappings || mappings.length === 0) {
      console.log(`[Sync API] No mappings to sync`);
      return NextResponse.json({
        success: true,
        recordsFetched: 0,
        recordsUpdated: 0,
        message: 'No active mappings configured'
      });
    }

    // Helper function to replace dynamic date placeholders
    const replaceDatePlaceholders = (queryString: string): string => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-indexed

      // Helper to format date as YYYY-MM-DD
      const formatDate = (d: Date): string => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      // Current date
      const currentDate = formatDate(now);

      // Current month
      const currentMonthStart = new Date(year, month, 1);
      const currentMonthEnd = new Date(year, month + 1, 0);

      // Last month
      const lastMonthStart = new Date(year, month - 1, 1);
      const lastMonthEnd = new Date(year, month, 0);

      // Current quarter (Q1=0-2, Q2=3-5, Q3=6-8, Q4=9-11)
      const currentQuarter = Math.floor(month / 3);
      const currentQuarterStart = new Date(year, currentQuarter * 3, 1);
      const currentQuarterEnd = new Date(year, currentQuarter * 3 + 3, 0);

      // Last quarter
      const lastQuarterMonth = currentQuarter * 3 - 3;
      const lastQuarterYear = lastQuarterMonth < 0 ? year - 1 : year;
      const lastQuarterStartMonth = lastQuarterMonth < 0 ? 9 : lastQuarterMonth; // Q4 of last year if negative
      const lastQuarterStart = new Date(lastQuarterYear, lastQuarterStartMonth, 1);
      const lastQuarterEnd = new Date(lastQuarterYear, lastQuarterStartMonth + 3, 0);

      // Current year
      const currentYearStart = new Date(year, 0, 1);
      const currentYearEnd = new Date(year, 11, 31);

      // Last year
      const lastYearStart = new Date(year - 1, 0, 1);
      const lastYearEnd = new Date(year - 1, 11, 31);

      // Year to date (Jan 1 to today)
      const ytdStart = new Date(year, 0, 1);

      return queryString
        // Current date
        .replace(/CURRENT_DATE/g, currentDate)
        // Current month
        .replace(/CURRENT_MONTH_START/g, formatDate(currentMonthStart))
        .replace(/CURRENT_MONTH_END/g, formatDate(currentMonthEnd))
        // Last month
        .replace(/LAST_MONTH_START/g, formatDate(lastMonthStart))
        .replace(/LAST_MONTH_END/g, formatDate(lastMonthEnd))
        // Current quarter
        .replace(/CURRENT_QUARTER_START/g, formatDate(currentQuarterStart))
        .replace(/CURRENT_QUARTER_END/g, formatDate(currentQuarterEnd))
        // Last quarter
        .replace(/LAST_QUARTER_START/g, formatDate(lastQuarterStart))
        .replace(/LAST_QUARTER_END/g, formatDate(lastQuarterEnd))
        // Current year
        .replace(/CURRENT_YEAR_START/g, formatDate(currentYearStart))
        .replace(/CURRENT_YEAR_END/g, formatDate(currentYearEnd))
        // Last year
        .replace(/LAST_YEAR_START/g, formatDate(lastYearStart))
        .replace(/LAST_YEAR_END/g, formatDate(lastYearEnd))
        // Year to date
        .replace(/YTD_START/g, formatDate(ytdStart));
    };

    // Perform the sync based on integration type
    if (type === 'hubspot') {
      const client = createHubSpotClient(integration.config);

      // Process each mapping
      for (const mapping of mappings) {
        try {
          // Parse the query (should be JSON for HubSpot) and replace date placeholders
          const queryWithDates = replaceDatePlaceholders(mapping.query);
          console.log(`[HubSpot] Processing mapping for metric ${mapping.metric_id}, query:`, queryWithDates);
          const filterCriteria = JSON.parse(queryWithDates);

          // Determine object type from query or default to deals
          const objectType = filterCriteria._objectType || 'deals';
          delete filterCriteria._objectType;

          // Execute query with aggregation
          const value = await client.executeQueryWithAggregation(
            objectType,
            filterCriteria,
            mapping.aggregation_method || 'sum',
            mapping.value_field
          );

          recordsFetched += 1;

          // Apply transformation rules if any
          let finalValue = value;
          if (mapping.transformation_rules) {
            if (mapping.transformation_rules.divide) {
              finalValue = finalValue / mapping.transformation_rules.divide;
            }
            if (mapping.transformation_rules.multiply) {
              finalValue = finalValue * mapping.transformation_rules.multiply;
            }
          }

          // Update the metric
          await supabase
            .from('metrics')
            .update({ current_value: finalValue })
            .eq('id', mapping.metric_id);

          recordsUpdated += 1;
        } catch (error: any) {
          console.error(`Error processing HubSpot mapping ${mapping.id}:`, error);
          // Continue with other mappings
        }
      }
    } else if (type === 'jira') {
      const client = createJiraClient(integration.config);

      // Process each mapping
      for (const mapping of mappings) {
        try {
          // Replace date placeholders in JQL query
          const jqlWithDates = replaceDatePlaceholders(mapping.query);

          // Execute JQL query with aggregation
          const value = await client.executeQueryWithAggregation(
            jqlWithDates, // JQL query string with replaced dates
            mapping.aggregation_method || 'sum',
            mapping.value_field
          );

          recordsFetched += 1;

          // Apply transformation rules if any
          let finalValue = value;
          if (mapping.transformation_rules) {
            if (mapping.transformation_rules.divide) {
              finalValue = finalValue / mapping.transformation_rules.divide;
            }
            if (mapping.transformation_rules.multiply) {
              finalValue = finalValue * mapping.transformation_rules.multiply;
            }
          }

          // Update the metric
          await supabase
            .from('metrics')
            .update({ current_value: finalValue })
            .eq('id', mapping.metric_id);

          recordsUpdated += 1;
        } catch (error: any) {
          console.error(`Error processing Jira mapping ${mapping.id}:`, error);
          // Continue with other mappings
        }
      }
    } else if (type === 'google_sheets') {
      const client = createGoogleSheetsClient(integration.config);

      // Process each mapping
      for (const mapping of mappings) {
        try {
          // Query format: JSON with spreadsheetId, range, valueColumnIndex, hasHeaderRow
          const queryConfig = JSON.parse(mapping.query);
          const spreadsheetId = queryConfig.spreadsheetId || integration.config.defaultSpreadsheetId;

          if (!spreadsheetId) {
            console.error(`No spreadsheet ID configured for mapping ${mapping.id}`);
            continue;
          }

          // Execute query with aggregation
          const value = await client.executeQueryWithAggregation(
            spreadsheetId,
            queryConfig.range,
            mapping.aggregation_method || 'sum',
            queryConfig.valueColumnIndex || 0,
            queryConfig.hasHeaderRow !== false // Default to true
          );

          recordsFetched += 1;

          // Apply transformation rules if any
          let finalValue = value;
          if (mapping.transformation_rules) {
            if (mapping.transformation_rules.divide) {
              finalValue = finalValue / mapping.transformation_rules.divide;
            }
            if (mapping.transformation_rules.multiply) {
              finalValue = finalValue * mapping.transformation_rules.multiply;
            }
          }

          // Update the metric
          await supabase
            .from('metrics')
            .update({ current_value: finalValue })
            .eq('id', mapping.metric_id);

          recordsUpdated += 1;
        } catch (error: any) {
          console.error(`Error processing Google Sheets mapping ${mapping.id}:`, error);
          // Continue with other mappings
        }
      }
    }

    // Update sync log with success
    await supabase
      .from('integration_sync_logs')
      .update({
        status: 'success',
        completed_at: new Date().toISOString(),
        records_fetched: recordsFetched,
        records_updated: recordsUpdated,
      })
      .eq('id', syncLog.id);

    // Update integration last_sync
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_sync_error: null,
      })
      .eq('id', integration.id);

    console.log(`[Sync API] ✅ Sync completed successfully - fetched: ${recordsFetched}, updated: ${recordsUpdated}`);

    return NextResponse.json({
      success: true,
      recordsFetched,
      recordsUpdated,
    });
  } catch (error: any) {
    console.error('Sync error:', error);

    // Update sync log with failure
    await supabase
      .from('integration_sync_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
      })
      .eq('id', syncLog.id);

    // Update integration last_sync
    await supabase
      .from('integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'failed',
        last_sync_error: error.message,
      })
      .eq('id', integration.id);

    return NextResponse.json(
      { error: `Sync failed: ${error.message}` },
      { status: 500 }
    );
  }
}
