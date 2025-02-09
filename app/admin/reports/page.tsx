'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Search, Loader2, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  content: string
  created_at: string
}

interface UserProfile {
  id: string
  username: string
  avatar_url: string | null
}

interface Report {
  id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  resolved_at: string | null
  notes: string | null
  message_id: string | null
  reported_user_id: string
  reporter_id: string
  reported_user: UserProfile | null
  reporter: UserProfile | null
  message: Message | null
}

interface DatabaseReport {
  id: string
  reason: string
  status: 'pending' | 'resolved' | 'dismissed'
  created_at: string
  resolved_at: string | null
  notes: string | null
  message_id: string | null
  reported_user_id: string
  reporter_id: string
  message: Message | null
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'dismissed'>('resolved')
  const [notes, setNotes] = useState('')
  const [showMessageHistory, setShowMessageHistory] = useState(false)
  const [userMessages, setUserMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setCurrentSession(session)
    }
    checkSession()
  }, [])

  const fetchReports = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      // Get reports with user information from auth.users
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          status,
          created_at,
          resolved_at,
          notes,
          message_id,
          reported_user_id,
          reporter_id,
          message:message_id (
            id,
            content,
            created_at
          )
        `)
        .order('created_at', { ascending: false })
        .returns<DatabaseReport[]>()

      if (reportsError) {
        console.error('Supabase error:', reportsError)
        throw new Error(reportsError.message)
      }

      if (!reportsData) {
        setReports([])
        return
      }

      // Fetch user details separately since we can't directly join with auth.users
      const userIds = new Set([
        ...reportsData.map(r => r.reported_user_id),
        ...reportsData.map(r => r.reporter_id)
      ].filter(Boolean))

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(userIds))
        .returns<UserProfile[]>()

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw new Error(usersError.message)
      }

      // Create a map of user details
      const userMap = (usersData || []).reduce<Record<string, UserProfile>>((acc, user) => {
        acc[user.id] = user
        return acc
      }, {})

      // Transform the data to ensure all fields are properly typed
      const formattedReports: Report[] = reportsData.map(report => ({
        id: report.id,
        reason: report.reason,
        status: report.status,
        created_at: report.created_at,
        resolved_at: report.resolved_at,
        notes: report.notes,
        message_id: report.message_id,
        reported_user_id: report.reported_user_id,
        reporter_id: report.reporter_id,
        reported_user: userMap[report.reported_user_id] || null,
        reporter: userMap[report.reporter_id] || null,
        message: report.message
      }))

      setReports(formattedReports)
    } catch (error: any) {
      console.error('Error fetching reports:', error)
      toast.error(error.message || 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    const fetchBannedUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase
          .from('banned_users')
          .select('user_id')
          .is('unbanned_at', null)

        if (error) {
          console.error('Error fetching banned users:', error.message)
          toast.error('Failed to fetch banned users status')
          return
        }

        setBannedUsers(new Set(data?.map(ban => ban.user_id) || []))
      } catch (error: any) {
        console.error('Error in fetchBannedUsers:', error.message)
        toast.error('Failed to load user status')
      }
    }

    fetchBannedUsers()
  }, [])

  const handleResolve = async () => {
    if (!selectedReport || !resolutionStatus) return

    try {
      const { error } = await supabase.rpc('resolve_report', {
        p_report_id: selectedReport.id,
        p_status: resolutionStatus,
        p_notes: notes || null
      })

      if (error) {
        console.error('Error resolving report:', error)
        throw new Error(error.message)
      }

      toast.success('Report resolved successfully')
      setShowResolveDialog(false)
      setSelectedReport(null)
      setNotes('')
      
      // Refresh reports to remove resolved ones
      fetchReports()
    } catch (error: any) {
      console.error('Error resolving report:', error)
      toast.error(error.message || 'Failed to resolve report')
    }
  }

  const fetchUserMessages = async (userId: string) => {
    setLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setUserMessages(data || [])
    } catch (error: any) {
      console.error('Error fetching user messages:', error)
      toast.error('Failed to fetch user messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleBanUser = async (userId: string, username: string) => {
    if (!currentSession?.user?.id) {
      toast.error('You must be logged in to ban users')
      return
    }

    try {
      const reason = prompt('Enter reason for ban:')
      if (!reason) {
        toast.error('A reason is required to ban a user')
        return
      }

      // First check if user is already banned
      const { data: existingBan } = await supabase
        .from('banned_users')
        .select('id')
        .eq('user_id', userId)
        .is('unbanned_at', null)
        .single()

      if (existingBan) {
        toast.error('User is already banned')
        return
      }

      // Start a transaction by using RPC
      const { data: banResult, error: banError } = await supabase.rpc('ban_user', {
        p_user_id: userId,
        p_admin_id: currentSession.user.id,
        p_reason: reason
      })

      if (banError) {
        console.error('Error in ban_user RPC:', banError)
        throw new Error(banError.message)
      }

      // Send a system notification to the banned user
      const { error: notificationError } = await supabase.rpc('send_system_notification', {
          p_user_id: userId,
        p_content: `Your account has been banned for the following reason: ${reason}. If you believe this was a mistake, please contact support@typni.com to appeal.`,
          p_channel_id: null
        })

      if (notificationError) {
        console.error('Error sending ban notification:', notificationError)
        // Don't throw here as the ban was successful
      }

      // Update local state
      setBannedUsers(prev => new Set([...prev, userId]))
      
        toast.success(`User ${username} has been banned`)

      // Refresh reports to update UI
      fetchReports()

    } catch (error: any) {
      console.error('Error banning user:', error)
      toast.error(error.message || 'Failed to ban user. Please try again.')
    }
  }

  const handleUnbanUser = async (userId: string, username: string) => {
    if (!currentSession?.user?.id) {
      toast.error('You must be logged in to unban users')
      return
    }

    try {
      const reason = prompt('Enter reason for unbanning:')
      if (!reason) {
        toast.error('A reason is required to unban users')
        return
      }

      // Call the unban_user RPC function
      const { error: unbanError } = await supabase.rpc('unban_user', {
        p_user_id: userId,
        p_admin_id: currentSession.user.id,
        p_unban_reason: reason
      })

      if (unbanError) {
        console.error('Error in unban_user RPC:', unbanError)
        throw new Error(unbanError.message)
      }

      // Send a system notification to the unbanned user
      const { error: notificationError } = await supabase.rpc('send_system_notification', {
        p_user_id: userId,
        p_content: `Your account has been unbanned. You can now access all features of the platform again.`,
        p_channel_id: null
      })

      if (notificationError) {
        console.error('Error sending unban notification:', notificationError)
        // Don't throw here as the unban was successful
      }

      // Update local state
      setBannedUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })

      toast.success(`User ${username} has been unbanned`)
      
      // Refresh reports
      fetchReports()

    } catch (error: any) {
      console.error('Error unbanning user:', error)
      toast.error(error.message || 'Failed to unban user. Please try again.')
    }
  }

  // Filter out resolved reports by default
  const filteredReports = reports.filter(report => 
    (report.status === 'pending') && // Only show pending reports
    (report.reported_user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reporter?.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reason.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const renderActionButtons = (report: Report) => (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSelectedReport(report)
          setShowResolveDialog(true)
        }}
        disabled={report.status !== 'pending'}
      >
        Resolve
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          fetchUserMessages(report.reported_user?.id || '')
          setShowMessageHistory(true)
        }}
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      {bannedUsers.has(report.reported_user?.id || '') ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUnbanUser(report.reported_user?.id || '', report.reported_user?.username || '')}
          className="text-green-600 hover:text-green-700"
        >
          Unban User
        </Button>
      ) : (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleBanUser(report.reported_user?.id || '', report.reported_user?.username || '')}
        >
          Ban User
        </Button>
      )}
    </div>
  )

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Reports</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reported User</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {report.reported_user?.username || report.reported_user?.username || 'Unknown User'}
                  </TableCell>
                  <TableCell>
                    {report.reporter?.username || report.reporter?.username || 'Unknown User'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : report.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    {renderActionButtons(report)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              Review and resolve the report for user {selectedReport?.reported_user?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReport?.message && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reported Message:</label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{selectedReport.message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent {formatDistanceToNow(new Date(selectedReport.message.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution</label>
              <Select
                value={resolutionStatus}
                onValueChange={(value: 'resolved' | 'dismissed') => setResolutionStatus(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add any notes about the resolution"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveDialog(false)
                setSelectedReport(null)
                setNotes('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve}>
              Resolve Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMessageHistory} onOpenChange={setShowMessageHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message History</DialogTitle>
            <DialogDescription>
              Recent messages from {selectedReport?.reported_user?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {loadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {userMessages.map((message) => (
                  <div key={message.id} className="p-3 bg-muted rounded-md">
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sent {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
                {userMessages.length === 0 && (
                  <p className="text-center text-muted-foreground">No messages found</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 