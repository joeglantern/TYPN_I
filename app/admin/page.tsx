'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield, UserPlus, AlertCircle, BookOpen, Loader2, Check, Ban, Unlock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface User {
  id: string
  username: string
  email: string
  avatar_url: string | null
  is_verified: boolean
  role: string
  is_banned: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [bannedUsersCount, setBannedUsersCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUsers, setShowUsers] = useState(false)

  useEffect(() => {
    checkAdmin()
    fetchUsers()
    fetchBannedUsersCount()
  }, [])

  const checkAdmin = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) {
      router.push('/auth/login')
      return
    }

    setSession(currentSession)

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentSession.user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      router.push('/')
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('username')

      if (error) throw error

      setUsers(users)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchBannedUsersCount = async () => {
    try {
      const { data: bannedUsersData, error } = await supabase
        .from('banned_users')
        .select('id', { count: 'exact' })
        .is('unbanned_at', null)

      if (error) throw error
      setBannedUsersCount(bannedUsersData.length)
    } catch (error) {
      console.error('Error fetching banned users count:', error)
      toast.error('Failed to fetch banned users count')
    }
  }

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_user_verification', {
        p_user_id: userId,
        p_admin_id: session.user.id
      })

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_verified: !currentStatus }
          : user
      ))

      toast.success(`User ${currentStatus ? 'unverified' : 'verified'} successfully`)
    } catch (error) {
      console.error('Error toggling verification:', error)
      toast.error('Failed to update verification status')
    }
  }

  const handlePromoteToAdmin = async (user: User) => {
    try {
      const response = await fetch('/api/admin/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      toast.success(`${user.username || user.email} has been promoted to admin`)
      fetchUsers() // Refresh the user list
      setSelectedUser(null)
    } catch (error) {
      console.error('Error promoting user:', error)
      toast.error('Failed to promote user to admin')
    }
  }

  const handleBanUser = async (userId: string) => {
    try {
      const reason = prompt('Enter reason for ban:')
      if (!reason) return

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error('No authenticated session')
      }

      // Create the ban record
      const { error: banError } = await supabase
        .from('banned_users')
        .insert([{
          user_id: userId,
          admin_id: session.user.id,
          reason: reason,
          created_at: new Date().toISOString()
        }])

      if (banError) throw banError

      // Update the user's banned status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', userId)

      if (updateError) throw updateError

      toast.success('User banned successfully')
      fetchUsers()
      fetchBannedUsersCount()
    } catch (error: any) {
      console.error('Error banning user:', error)
      toast.error(error.message || 'Failed to ban user')
    }
  }

  const handleUnban = async (userId: string) => {
    try {
      const reason = prompt('Enter reason for unbanning (optional):')
      
      const { error } = await supabase.rpc('unban_user', {
        p_user_id: userId,
        p_admin_id: session?.user?.id,
        p_channel_id: null,
        p_unban_reason: reason || null
      })

      if (error) throw error
      
      toast.success('User unbanned successfully')
      fetchUsers()
      fetchBannedUsersCount()
    } catch (error: any) {
      console.error('Error unbanning user:', error.message)
      toast.error(error.message || 'Failed to unban user')
    }
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-12 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUsers(!showUsers)}
            >
              {showUsers ? 'Hide Users' : 'Show Users'}
            </Button>
          </CardTitle>
          {showUsers && (
            <div className="mt-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {showUsers ? (
          <div className="space-y-4">
              {filteredUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                    ) : (
                      <AvatarFallback>
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.username}</span>
                      {user.is_verified && (
                        <div className="h-4 w-4 bg-[#1DA1F2] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}>
                          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                      {user.role === 'admin' && (
                        <span className="relative inline-flex items-center px-2 py-0.5 text-xs">
                          <span className="absolute inset-0">
                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <path
                                d="M0,50 L10,40 L20,50 L30,40 L40,50 L50,40 L60,50 L70,40 L80,50 L90,40 L100,50 L100,100 L0,100 Z"
                                className="fill-primary/10"
                                vectorEffect="non-scaling-stroke"
                              />
                            </svg>
                          </span>
                          <span className="relative text-primary font-medium">Admin</span>
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={user.is_verified ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleVerification(user.id, user.is_verified)}
                  >
                    {user.is_verified ? (
                      <>
                        <Ban className="h-4 w-4 mr-2" />
                        Unverify
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                    {user.role !== 'admin' && (
                      user.is_banned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnban(user.id)}
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBanUser(user.id)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Ban
                        </Button>
                      )
                    )}
                  </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Click "Show Users" to view and manage users
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banned Users</CardTitle>
          <CardDescription>
            Manage banned users across all channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{bannedUsersCount}</p>
          <p className="text-sm text-muted-foreground">Total banned users</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => router.push('/admin/banned-users')}>
            <Ban className="h-4 w-4 mr-2" />
            View Banned Users
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote {selectedUser?.username || selectedUser?.email} to administrator?
              This will give them full access to manage the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#5865F2] hover:bg-[#4752C4]"
              onClick={() => selectedUser && handlePromoteToAdmin(selectedUser)}
            >
              Promote User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 