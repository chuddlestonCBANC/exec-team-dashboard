import { NextRequest, NextResponse } from 'next/server';
import { createNarrative } from '@/lib/supabase/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: metricId } = await params;
    const body = await request.json();
    const { executiveId, content } = body;

    if (!executiveId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await createNarrative({
      metricId,
      executiveId,
      content,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ narrative: data });
  } catch (error: any) {
    console.error('[Narratives API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
