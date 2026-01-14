import { NextRequest, NextResponse } from 'next/server';
import { createCommitment } from '@/lib/supabase/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: metricId } = await params;
    const body = await request.json();
    const { executiveId, title, description, targetDate } = body;

    if (!executiveId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await createCommitment({
      metricId,
      executiveId,
      title,
      description,
      targetDate,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ commitment: data });
  } catch (error: any) {
    console.error('[Commitments API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
