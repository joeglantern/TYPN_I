import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return new NextResponse('Not authenticated', { status: 401 })
    }

    // Update profile role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', session.user.id)

    if (profileError) throw profileError

    // Update JWT claims
    const { error: userError } = await supabase.rpc('promote_to_admin', {
      p_user_id: session.user.id,
      p_admin_id: session.user.id
    })

    if (userError) throw userError

    return NextResponse.json({ 
      message: 'Successfully promoted to admin',
      userId: session.user.id 
    })
  } catch (error) {
    console.error('Error promoting to admin:', error)
    return new NextResponse('Failed to promote to admin', { status: 500 })
  }
} 