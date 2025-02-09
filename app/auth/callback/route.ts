import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) throw error
      
      if (!session) {
        throw new Error('No session')
      }

      // Get user role from metadata
      const role = session.user.user_metadata?.role || 'user'
      
      // Redirect based on role
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', requestUrl.origin))
      }
      
      return NextResponse.redirect(new URL('/profile', requestUrl.origin))
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
    }
  }

  // No code, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
} 