import { NextRequest, NextResponse } from 'next/server';
import { updateNarrative, deleteNarrative } from '@/lib/supabase/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; narrativeId: string }> }
) {
  try {
    const { narrativeId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const { data, error } = await updateNarrative(narrativeId, content);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ narrative: data });
  } catch (error: any) {
    console.error('[Narrative Update API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; narrativeId: string }> }
) {
  try {
    const { narrativeId } = await params;

    const { error } = await deleteNarrative(narrativeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Narrative Delete API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
