import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all approved users
    const { data: users, error } = await supabase
      .from('approved_users')
      .select('id, email, role, auth_user_id, executive_id')
      .eq('is_active', true)
      .order('email');

    if (error) {
      console.error('[Approved Users API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('[Approved Users API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
