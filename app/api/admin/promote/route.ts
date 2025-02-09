import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Call the promote_to_admin function
    const { error } = await supabase.rpc('promote_to_admin', {
      p_user_id: userId,
      p_admin_id: session.user.id
    })

    if (error) {
      console.error('Error promoting user:', error)
      return new NextResponse(error.message, { status: 400 })
    }

    return new NextResponse('User promoted to admin successfully', { status: 200 })
  } catch (error) {
    console.error('Error in promote route:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 