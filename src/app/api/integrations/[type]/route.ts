import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createHubSpotClient } from '@/lib/integrations/hubspot';
import { createJiraClient } from '@/lib/integrations/jira';

// GET - Get integration status and configuration
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const supabase = await createClient();
  const { type } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: integration, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('type', type)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Don't send sensitive config data to client
  if (integration?.config) {
    integration.config = {
      ...integration.config,
      apiKey: integration.config.apiKey ? '••••••••' : undefined,
      accessToken: integration.config.accessToken ? '••••••••' : undefined,
      apiToken: integration.config.apiToken ? '••••••••' : undefined,
    };
  }

  return NextResponse.json({ integration: integration || null });
}

// POST - Save or update integration configuration
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
  const { config, name } = body;

  // Test the connection before saving
  let isValid = false;
  try {
    if (type === 'hubspot') {
      const client = createHubSpotClient(config);
      isValid = await client.testConnection();
    } else if (type === 'jira') {
      const client = createJiraClient(config);
      isValid = await client.testConnection();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: `Connection test failed: ${error.message}` },
      { status: 400 }
    );
  }

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid credentials or configuration' },
      { status: 400 }
    );
  }

  // Check if integration already exists
  const { data: existing } = await supabase
    .from('integrations')
    .select('id')
    .eq('type', type)
    .single();

  let result;
  if (existing) {
    // Update existing integration
    result = await supabase
      .from('integrations')
      .update({
        name,
        config,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    // Create new integration
    result = await supabase
      .from('integrations')
      .insert({
        type: type,
        name,
        config,
        is_active: true,
      })
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    integration: result.data,
  });
}

// DELETE - Disconnect integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const supabase = await createClient();
  const { type } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('type', type);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
