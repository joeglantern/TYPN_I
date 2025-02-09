'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Unlock, Ban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface BannedUserRaw {
  id: string
  user_id: string
  admin_id: string
  reason: string
  created_at: string
  channel_id: string | null
  user: {
    username: string
    avatar_url: string | null
  }[]
  admin: {
    username: string
  }[]
  channel: {
    name: string
  }[]
}

interface BannedUser {
  id: string
  user_id: string
  admin_id: string
  reason: string
  created_at: string
  channel_id: string | null
  username: string
  avatar_url: string | null
  admin_name: string
  channel_name?: string
}

export default function BannedUsersPage() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const fetchBannedUsers = async () => {
    try {
      console.log('Fetching banned users...')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: bannedUsersData, error } = await supabase
        .from('banned_users')
        .select(`
          id,
          user_id,
          admin_id,
          reason,
          created_at,
          channel_id,
          user:user_id (
            username,
            avatar_url
          ),
          admin:admin_id (
            username
          ),
          channel:channel_id (
            name
          )
        `)
        .is('unbanned_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching banned users:', error)
        throw error
      }

      console.log('Fetched banned users data:', bannedUsersData)

      if (!bannedUsersData) {
        console.log('No banned users found')
        setBannedUsers([])
        return
      }

      const { error: countError } = await supabase
        .from('banned_users_count')
        .upsert({
          id: (await supabase.from('banned_users_count').select('id').single()).data?.id,
          count: bannedUsersData.length,
          updated_at: new Date().toISOString()
        })

      if (countError) {
        console.error('Error updating banned users count:', countError)
      }

      const formattedBannedUsers = (bannedUsersData as BannedUserRaw[]).map(user => ({
        id: user.id,
        user_id: user.user_id,
        admin_id: user.admin_id,
        reason: user.reason,
        created_at: user.created_at,
        channel_id: user.channel_id,
        username: user.user[0]?.username || 'Unknown User',
        avatar_url: user.user[0]?.avatar_url || null,
        admin_name: user.admin[0]?.username || 'Unknown Admin',
        channel_name: user.channel[0]?.name
      }))

      console.log('Formatted banned users:', formattedBannedUsers)
      setBannedUsers(formattedBannedUsers)
    } catch (error: any) {
      console.error('Error in fetchBannedUsers:', error)
      toast.error('Failed to fetch banned users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBannedUsers()
  }, [])

  const handleUnban = async (userId: string, channelId: string | null) => {
    try {
      const reason = prompt('Enter reason for unbanning (optional):')
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to unban users')
      }
      
      const { error } = await supabase.rpc('unban_user', {
        p_user_id: userId,
        p_admin_id: session.user.id,
        p_channel_id: channelId || undefined,
        p_unban_reason: reason || null
      })

      if (error) throw error
      
      toast.success('User unbanned successfully')
      fetchBannedUsers()
    } catch (error: any) {
      console.error('Error unbanning user:', error.message)
      toast.error(error.message || 'Failed to unban user')
    }
  }

  const filteredUsers = bannedUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.channel_name && user.channel_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Banned Users</h1>
          <p className="text-muted-foreground">
            Manage banned users across all channels
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin')}>
          Back to Dashboard
        </Button>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search banned users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
      </div>

      <ScrollArea className="h-[calc(100vh-250px)] rounded-md border">
        <div className="p-4 space-y-4">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? 'No banned users match your search' : 'No banned users found'}
            </p>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-start justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-start gap-3">
                  <Avatar>
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} />
                    ) : (
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Banned by {user.admin_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Reason: {user.reason}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Banned {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </p>
                    {user.channel_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Channel: {user.channel_name || 'Unknown'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnban(user.user_id, user.channel_id)}
                    className="shrink-0"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Unban
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 
