import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { executive_id } = body;

    // Update the approved_user's executive_id link
    const { error } = await supabase
      .from('approved_users')
      .update({ executive_id })
      .eq('id', id);

    if (error) {
      console.error('[Update User API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Update User API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
