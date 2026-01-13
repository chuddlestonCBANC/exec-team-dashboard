import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ approved: false, error: 'Not authenticated' }, { status: 401 });
  }

  // Check if user is in approved_users table
  const { data: approvedUser, error } = await supabase
    .from('approved_users')
    .select(`
      id,
      email,
      role,
      executive_id,
      is_active,
      first_login_at
    `)
    .eq('email', user.email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !approvedUser) {
    return NextResponse.json({
      approved: false,
      error: 'User not approved for access'
    }, { status: 403 });
  }

  // Link auth user if first login
  if (!approvedUser.first_login_at) {
    await supabase
      .from('approved_users')
      .update({
        auth_user_id: user.id,
        first_login_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      })
      .eq('id', approvedUser.id);
  } else {
    // Update last login
    await supabase
      .from('approved_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', approvedUser.id);
  }

  return NextResponse.json({
    approved: true,
    user: {
      id: approvedUser.id,
      email: approvedUser.email,
      role: approvedUser.role,
      executiveId: approvedUser.executive_id,
    }
  });
}
