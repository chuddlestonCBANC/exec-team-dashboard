import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHubSpotClient } from '@/lib/integrations/hubspot';
import { createJiraClient } from '@/lib/integrations/jira';

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
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');

      // Get first day of current month
      const monthStart = `${year}-${month}-01`;

      // Get last day of current month
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      return queryString
        .replace(/CURRENT_MONTH_START/g, monthStart)
        .replace(/CURRENT_MONTH_END/g, monthEnd)
        .replace(/CURRENT_DATE/g, `${year}-${month}-${day}`);
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
