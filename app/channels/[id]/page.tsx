import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ChannelPage({ params }: { params: { id: string } }) {
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
  
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: channel } = await supabase
    .from('channels')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!channel) {
    redirect('/channels')
  }

  return (
    <div className="flex flex-col w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-4">{channel.name}</h1>
      <div className="flex-1">
        {/* Channel content will go here */}
      </div>
    </div>
  )
} 