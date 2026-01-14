import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET - List all mappings for an integration (optionally filter by metricId)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const supabase = await createClient();
  const { type } = await params;
  const { searchParams } = new URL(request.url);
  const metricId = searchParams.get('metricId');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the integration
  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('id')
    .eq('type', type)
    .single();

  if (integrationError || !integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  // Build query
  let query = supabase
    .from('integration_mappings')
    .select('*')
    .eq('integration_id', integration.id);

  if (metricId) {
    query = query.eq('metric_id', metricId);
  }

  const { data: mappings, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mappings });
}

// POST - Create a new mapping
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const supabase = await createClient();
  const { type } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { integration_id, metric_id, query, aggregation_method, value_field, transformation_rules } = body;

  if (!integration_id || !metric_id || !query) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('integration_mappings')
    .insert({
      integration_id,
      metric_id,
      query,
      aggregation_method: aggregation_method || 'sum',
      value_field: value_field || null,
      transformation_rules: transformation_rules || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mapping: data });
}
