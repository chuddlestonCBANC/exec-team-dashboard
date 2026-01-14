import { NextRequest, NextResponse } from 'next/server';
import { updateCommitment, deleteCommitment } from '@/lib/supabase/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  try {
    const { commitmentId } = await params;
    const body = await request.json();

    const { data, error } = await updateCommitment(commitmentId, body);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ commitment: data });
  } catch (error: any) {
    console.error('[Commitment Update API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commitmentId: string }> }
) {
  try {
    const { commitmentId } = await params;

    const { error } = await deleteCommitment(commitmentId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Commitment Delete API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
