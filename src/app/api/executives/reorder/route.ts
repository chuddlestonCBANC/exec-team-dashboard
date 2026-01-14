import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { executives } = await request.json();

    if (!executives || !Array.isArray(executives)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Update each executive's sort_order
    const updates = executives.map((exec: { id: string; sort_order: number }) =>
      supabase
        .from('executives')
        .update({ sort_order: exec.sort_order })
        .eq('id', exec.id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error('[Reorder Executives API] Errors:', errors);
      return NextResponse.json(
        { error: 'Failed to update some executives' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Reorder Executives API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
