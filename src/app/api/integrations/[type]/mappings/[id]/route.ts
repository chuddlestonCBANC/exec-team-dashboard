import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// PUT - Update a mapping
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const supabase = await createClient();
  const { type, id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { query, aggregation_method, value_field, transformation_rules } = body;

  const { data, error } = await supabase
    .from('integration_mappings')
    .update({
      query,
      aggregation_method: aggregation_method || 'sum',
      value_field: value_field || null,
      transformation_rules: transformation_rules || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mapping: data });
}

// DELETE - Delete a mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const supabase = await createClient();
  const { type, id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('integration_mappings')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
