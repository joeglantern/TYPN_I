'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { BarChart, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface Poll {
  id: string
  question: string
  options: string[]
  votes: { [key: string]: number }
  created_at: string
  ends_at: string
  is_closed: boolean
  channel_id: string
  total_votes: number
  user_vote?: number
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchPolls = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUserId(session?.user?.id || null)
        await fetchPolls()
      } catch (error) {
        console.error('Error checking auth:', error)
        toast.error('Failed to load polls')
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchPolls()

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
  }, [])

  const fetchPolls = async () => {
    try {
      const { data: pollsData, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (userId) {
        // Fetch user votes
        const { data: votesData } = await supabase
          .from('poll_votes')
          .select('poll_id, option_index')
          .eq('user_id', userId)

        const userVotes = new Map(votesData?.map(vote => [vote.poll_id, vote.option_index]))

        const formattedPolls = pollsData.map(poll => ({
          ...poll,
          total_votes: Object.values(poll.votes || {}).reduce<number>((a, b) => {
            const numA = typeof a === 'number' ? a : 0;
            const numB = typeof b === 'number' ? b : 0;
            return numA + numB;
          }, 0),
          user_vote: userVotes.get(poll.id)
        }))
        setPolls(formattedPolls)
      } else {
        const formattedPolls = pollsData.map(poll => ({
          ...poll,
          total_votes: Object.values(poll.votes || {}).reduce<number>((a, b) => {
            const numA = typeof a === 'number' ? a : 0;
            const numB = typeof b === 'number' ? b : 0;
            return numA + numB;
          }, 0)
        }))
        setPolls(formattedPolls)
      }
    } catch (error) {
      console.error('Error fetching polls:', error)
      toast.error('Failed to fetch polls')
    }
  }

  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user?.id) {
        toast.error('Please log in to vote')
        router.push('/auth/login')
        return
      }

      // First check if poll is still active
      const { data: currentPoll, error: pollError } = await supabase
        .from('polls')
        .select('votes, is_closed, ends_at')
        .eq('id', pollId)
        .single()

      if (pollError) {
        console.error('Error fetching poll:', pollError)
        toast.error('Failed to fetch poll data')
        return
      }

      if (currentPoll.is_closed || new Date(currentPoll.ends_at) <= new Date()) {
        toast.error('This poll has ended')
        return
      }

      // Check if user has already voted
      const { data: existingVotes, error: voteCheckError } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (voteCheckError) {
        console.error('Failed to check vote status:', voteCheckError.message)
        toast.error('Failed to verify voting status')
        return
      }

      if (existingVotes) {
        toast.error('You have already voted in this poll')
        return
      }

      // Record the vote
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert({
          poll_id: pollId,
          user_id: session.user.id,
          option_index: optionIndex,
          user_agent: navigator.userAgent,
          device_type: /Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? 'mobile' : 'desktop'
        })

      if (voteError) {
        console.error('Error recording vote:', voteError)
        toast.error('Failed to record vote')
        return
      }

      // Update the poll's vote count
      const updatedVotes = { ...currentPoll.votes }
      updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1

      const { error: updateError } = await supabase
        .from('polls')
        .update({ 
          votes: updatedVotes,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', pollId)

      if (updateError) {
        console.error('Error updating poll votes:', updateError)
        toast.error('Failed to update vote count')
        return
      }

      toast.success('Vote recorded successfully!')
      await fetchPolls()
    } catch (error: any) {
      console.error('Error in handleVote:', error)
      toast.error(error.message || 'Failed to vote')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Community Polls</h1>
        <p className="text-muted-foreground">Vote and see what others think</p>
      </div>

      <div className="grid gap-6">
        {polls.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active polls at the moment
            </CardContent>
          </Card>
        ) : (
          polls.map((poll) => {
            const isPollEnded = new Date() >= new Date(poll.ends_at) || poll.is_closed
            const hasVoted = typeof poll.user_vote === 'number'

            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <CardHeader>
                    <div className="space-y-1">
                      <CardTitle>{poll.question}</CardTitle>
                      <CardDescription>
                        {isPollEnded ? (
                          <span className="text-destructive">Poll ended</span>
                        ) : (
                          <span>
                            Ends {formatDistanceToNow(new Date(poll.ends_at), { addSuffix: true })}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {poll.options.map((option, index) => {
                        const votes = poll.votes[index] || 0
                        const percentage = poll.total_votes > 0
                          ? Math.round((votes / poll.total_votes) * 100)
                          : 0
                        const isSelected = poll.user_vote === index

                        return (
                          <div key={index} className="space-y-2">
                            <Button
                              variant={isSelected ? "default" : "outline"}
                              className="w-full h-auto py-4 relative group"
                              disabled={isPollEnded || hasVoted}
                              onClick={() => handleVote(poll.id, index)}
                            >
                              <div className="absolute inset-0 flex items-center px-3">
                                <Progress 
                                  value={percentage} 
                                  className="h-full absolute inset-0 rounded-md transition-all duration-500"
                                />
                              </div>
                              <div className="relative z-10 flex justify-between w-full items-center">
                                <span className="font-medium">{option}</span>
                                <span className="text-sm">
                                  {votes} votes ({percentage}%)
                                </span>
                              </div>
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Created {formatDistanceToNow(new Date(poll.created_at), { addSuffix: true })}
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
    </div>
  )
} 