import { NextResponse } from 'next/server';
import { getDashboardDataExtended } from '@/lib/supabase/queries';

export async function GET() {
  const startTime = Date.now();
  console.log('[API] Starting getDashboardDataExtended...');

  try {
    const data = await getDashboardDataExtended();
    const duration = Date.now() - startTime;

    console.log(`[API] Complete in ${duration}ms`);
    console.log(`[API] Pillars: ${data.pillars.length}`);
    console.log(`[API] Executives: ${data.executives.length}`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      pillars: data.pillars.length,
      executives: data.executives.length,
      talkingItems: data.talkingItems.length,
      metricsToReview: data.metricsToReview.length,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
