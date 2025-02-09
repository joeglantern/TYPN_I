'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart, 
  Plus, 
  Minus, 
  Loader2, 
  Clock,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Poll {
  id: string
  question: string
  options: string[]
  votes: { [key: string]: number }
  created_at: string
  ends_at: string
  is_closed: boolean
  total_votes: number
  user_id: string
  created_by: {
    username: string
  }
}

export default function AdminPollsPage() {
  const router = useRouter()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [duration, setDuration] = useState('1h')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showReopenDialog, setShowReopenDialog] = useState(false)
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
  const [reopenDuration, setReopenDuration] = useState('24h')

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) {
          router.push('/auth/login')
          return
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role !== 'admin') {
          router.push('/')
          return
        }

        setIsAdmin(true)

        // Check if polls table exists and create it if needed
        const { error: tableError } = await supabase
          .from('polls')
          .select('id')
          .limit(1)

        if (tableError?.code === 'PGRST116') {
          // Table doesn't exist, create it
          const { error: createError } = await supabase.rpc('create_polls_table')
          if (createError) {
            console.error('Error creating polls table:', createError)
            toast.error('Failed to initialize polls system')
            return
          }
        }

        await fetchPolls()

        // Subscribe to poll changes
        const channel = supabase
          .channel('polls_changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'polls' },
            () => {
              fetchPolls()
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      } catch (error: any) {
        console.error('Error checking admin status:', error)
        toast.error('Failed to verify admin status')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndFetchData()
  }, [router])

  const fetchPolls = async () => {
    try {
      console.log('Fetching polls...')
      
      // First, get all polls
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false })

      if (pollsError) {
        console.error('Error fetching polls:', {
          message: pollsError.message,
          details: pollsError.details,
          hint: pollsError.hint,
          code: pollsError.code
        })
        toast.error(`Failed to fetch polls: ${pollsError.message}`)
        return
      }

      if (!pollsData) {
        console.log('No polls found')
        setPolls([])
        return
      }

      // Then, get usernames for all user_ids
      const userIds = [...new Set(pollsData.map(poll => poll.user_id))]
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      if (usersError) {
        console.error('Error fetching users:', usersError)
        toast.error('Failed to fetch user information')
        return
      }

      // Create a map of user_id to username
      const userMap = new Map(usersData?.map(user => [user.id, user.username]) || [])

      // Format the polls with user information
      const formattedPolls = pollsData.map(poll => ({
        ...poll,
        options: Array.isArray(poll.options) ? poll.options : [],
        votes: typeof poll.votes === 'object' ? poll.votes : {},
        total_votes: Object.values(poll.votes || {}).map(Number).reduce((a, b) => a + b, 0),
        created_by: {
          username: userMap.get(poll.user_id) || 'Unknown User'
        }
      }))

      console.log('Formatted polls:', formattedPolls)
      setPolls(formattedPolls)
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred'
      console.error('Error in fetchPolls:', {
        message: errorMessage,
        error: error
      })
      toast.error(`Failed to fetch polls: ${errorMessage}`)
    }
  }

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, ''])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options]
      newOptions.splice(index, 1)
      setOptions(newOptions)
    }
  }

  const handleCreatePoll = async () => {
    try {
      if (!question.trim()) {
        toast.error('Please enter a question')
        return
      }

      const validOptions = options.filter(opt => opt.trim())
      if (validOptions.length < 2) {
        toast.error('Please add at least 2 options')
        return
      }

      // Calculate end time based on duration
      const now = new Date()
      const durationMap: { [key: string]: number } = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '12h': 12 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '48h': 48 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }
      const endTime = new Date(now.getTime() + durationMap[duration])

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        toast.error('You must be logged in to create a poll')
        return
      }

      // Initialize votes object with 0 for each option
      const initialVotes = validOptions.reduce((acc, _, index) => {
        acc[index] = 0
        return acc
      }, {} as { [key: string]: number })

      const pollData = {
        question: question.trim(),
        options: validOptions,
        votes: initialVotes,
        ends_at: endTime.toISOString(),
        user_id: session.user.id,
        is_closed: false
      }

      console.log('Creating poll with data:', pollData)

      const { data: poll, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error in createPoll:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          data: pollData
        })
        toast.error(`Failed to create poll: ${error.message}`)
        return
      }

      if (!poll) {
        throw new Error('No poll data returned after creation')
      }

      setShowCreate(false)
      setQuestion('')
      setOptions(['', ''])
      toast.success('Poll created successfully!')
      await fetchPolls()
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred'
      console.error('Error in createPoll:', {
        message: errorMessage,
        error: error
      })
      toast.error(`Failed to create poll: ${errorMessage}`)
    }
  }

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)

      if (error) {
        console.error('Supabase error in deletePoll:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast.error(`Failed to delete poll: ${error.message}`)
        return
      }

      toast.success('Poll deleted successfully')
      await fetchPolls()
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred'
      console.error('Error in deletePoll:', {
        message: errorMessage,
        error: error
      })
      toast.error(`Failed to delete poll: ${errorMessage}`)
    }
  }

  const handleClosePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from('polls')
        .update({ is_closed: true })
        .eq('id', pollId)

      if (error) {
        console.error('Supabase error in closePoll:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        toast.error(`Failed to close poll: ${error.message}`)
        return
      }

      toast.success('Poll closed successfully')
      await fetchPolls()
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error occurred'
      console.error('Error in closePoll:', {
        message: errorMessage,
        error: error
      })
      toast.error(`Failed to close poll: ${errorMessage}`)
    }
  }

  const handleReopenPoll = async () => {
    if (!selectedPollId || !reopenDuration) {
      toast.error('Something went wrong')
      return
    }

    try {
      const now = new Date()
      const durationMap: { [key: string]: number } = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '12h': 12 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '48h': 48 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      }

      const newEndTime = new Date(now.getTime() + durationMap[reopenDuration])

      const { error } = await supabase
        .from('polls')
        .update({ 
          is_closed: false,
          ends_at: newEndTime.toISOString(),
          winning_option: null,
          winner_determined_at: null
        })
        .eq('id', selectedPollId)

      if (error) throw error

      toast.success(`Poll reopened for ${reopenDuration}`)
      setShowReopenDialog(false)
      setSelectedPollId(null)
      await fetchPolls()
    } catch (error) {
      console.error('Error reopening poll:', error)
      toast.error('Failed to reopen poll')
    }
  }

  const handleExtendPoll = async (pollId: string) => {
    try {
      const poll = polls.find(p => p.id === pollId)
      if (!poll) return

      const newEndTime = new Date(new Date(poll.ends_at).getTime() + 24 * 60 * 60 * 1000) // Add 24 hours

      const { error } = await supabase
        .from('polls')
        .update({ ends_at: newEndTime.toISOString() })
        .eq('id', pollId)

      if (error) throw error

      toast.success('Poll extended by 24 hours')
      fetchPolls()
    } catch (error) {
      console.error('Error extending poll:', error)
      toast.error('Failed to extend poll')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manage Polls</h1>
          <p className="text-muted-foreground">Create and manage community polls</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Poll</DialogTitle>
              <DialogDescription>
                Create a new poll for the community to vote on
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Question</label>
                  <Input
                    placeholder="Enter your question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Options</label>
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...options]
                          newOptions[index] = e.target.value
                          setOptions(newOptions)
                        }}
                      />
                      {index > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {options.length < 5 && (
                    <Button
                      variant="outline"
                      onClick={handleAddOption}
                      className="w-full gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <Select
                    value={duration}
                    onValueChange={(value) => setDuration(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="6h">6 hours</SelectItem>
                      <SelectItem value="12h">12 hours</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="48h">48 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePoll}>Create Poll</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {polls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No polls created yet
            </CardContent>
          </Card>
        ) : (
          polls.map((poll) => {
            const isPollEnded = new Date() >= new Date(poll.ends_at) || poll.is_closed
            const isEndingSoon = !isPollEnded && 
              new Date(poll.ends_at).getTime() - new Date().getTime() < 3600000

            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle>{poll.question}</CardTitle>
                        <CardDescription>
                          Created by {poll.created_by?.username || 'Unknown'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {!poll.is_closed && (
                          <>
                            {isEndingSoon && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExtendPoll(poll.id)}
                                className="gap-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Extend
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClosePoll(poll.id)}
                              className="gap-2"
                            >
                              <XCircle className="h-4 w-4" />
                              Close
                            </Button>
                          </>
                        )}
                        {poll.is_closed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPollId(poll.id)
                              setShowReopenDialog(true)
                            }}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Reopen
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeletePoll(poll.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {poll.options.map((option, index) => {
                        const votes = poll.votes[index] || 0
                        const percentage = poll.total_votes > 0
                          ? Math.round((votes / poll.total_votes) * 100)
                          : 0

                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>{option}</span>
                              <span className="text-muted-foreground">
                                {votes} votes ({percentage}%)
                              </span>
                            </div>
                            <Progress value={percentage} />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {poll.is_closed ? (
                          'Poll ended'
                        ) : isEndingSoon ? (
                          <span className="text-orange-500 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Ending soon
                          </span>
                        ) : (
                          `Ends ${formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}`
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart className="h-4 w-4" />
                      <span>{poll.total_votes} total votes</span>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })
        )}
      </div>

      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Poll</DialogTitle>
            <DialogDescription>
              Select how long the poll should remain open
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Select
                value={reopenDuration}
                onValueChange={(value) => setReopenDuration(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 hour</SelectItem>
                  <SelectItem value="6h">6 hours</SelectItem>
                  <SelectItem value="12h">12 hours</SelectItem>
                  <SelectItem value="24h">24 hours</SelectItem>
                  <SelectItem value="48h">48 hours</SelectItem>
                  <SelectItem value="7d">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReopenDialog(false)
                setSelectedPollId(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={() => handleReopenPoll()}>
              Reopen Poll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 