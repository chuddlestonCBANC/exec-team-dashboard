import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all commitments with their related data, ordered by target_date
    const { data: commitments, error } = await supabase
      .from('commitments')
      .select(`
        id,
        title,
        description,
        status,
        target_date,
        created_at,
        metric:metrics(
          id,
          name,
          pillar:pillars(name)
        ),
        executive:executives(
          id,
          name,
          headshot_url
        ),
        updates:commitment_updates(
          id,
          content,
          created_at,
          executive:executives(name)
        )
      `)
      .order('target_date', { ascending: true });

    if (error) {
      console.error('[Action Plans Timeline API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the frontend interface
    const actionPlans = commitments.map((commitment: any) => ({
      id: commitment.id,
      title: commitment.title,
      description: commitment.description || '',
      status: commitment.status,
      target_date: commitment.target_date,
      created_at: commitment.created_at,
      metric: {
        id: commitment.metric.id,
        name: commitment.metric.name,
        pillar: {
          name: commitment.metric.pillar.name,
        },
      },
      executive: {
        id: commitment.executive.id,
        name: commitment.executive.name,
        headshotUrl: commitment.executive.headshot_url,
      },
      updates: (commitment.updates || [])
        .sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .map((update: any) => ({
          id: update.id,
          content: update.content,
          created_at: update.created_at,
          executive: {
            name: update.executive.name,
          },
        })),
    }));

    return NextResponse.json({ actionPlans });
  } catch (error: any) {
    console.error('[Action Plans Timeline API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
