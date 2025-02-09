'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, ArrowLeft, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { Progress } from "@/components/ui/progress"

interface Poll {
  id: string
  title: string
  description: string
  options: {
    id: string
    text: string
    votes: string[] // Array of user IDs
  }[]
  created_by: string
  created_at: string
  ends_at: string
}

export default function PollsPage() {
  const router = useRouter()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [newPoll, setNewPoll] = useState({
    title: '',
    description: '',
    options: ['', '']
  })
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
    fetchPolls()

    const pollsSubscription = supabase
      .channel('polls')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'polls',
      }, () => {
        fetchPolls()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(pollsSubscription)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(profile)
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  const fetchPolls = async () => {
    try {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setPolls(data)
    } catch (error) {
      console.error('Error fetching polls:', error)
      toast({
        title: "Error",
        description: "Failed to fetch polls",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (creating) return

    try {
      setCreating(true)

      if (!newPoll.title.trim() || newPoll.options.some(opt => !opt.trim())) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive",
        })
        return
      }

      const pollData = {
        title: newPoll.title,
        description: newPoll.description,
        options: newPoll.options.map(text => ({
          id: crypto.randomUUID(),
          text,
          votes: []
        })),
        created_by: profile.id,
        ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }

      const { error } = await supabase
        .from('polls')
        .insert(pollData)

      if (error) throw error

      setNewPoll({
        title: '',
        description: '',
        options: ['', '']
      })

      toast({
        title: "Success",
        description: "Poll created successfully",
      })

    } catch (error) {
      console.error('Error creating poll:', error)
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      const poll = polls.find(p => p.id === pollId)
      if (!poll || !profile) return

      const option = poll.options.find(o => o.id === optionId)
      if (!option) return

      // Remove user's previous vote if any
      const updatedOptions = poll.options.map(o => ({
        ...o,
        votes: o.votes.filter(userId => userId !== profile.id)
      }))

      // Add new vote
      const votedOption = updatedOptions.find(o => o.id === optionId)
      if (votedOption) {
        votedOption.votes.push(profile.id)
      }

      const { error } = await supabase
        .from('polls')
        .update({ options: updatedOptions })
        .eq('id', pollId)

      if (error) throw error

      // Update local state
      setPolls(prev => prev.map(p => {
        if (p.id === pollId) {
          return { ...p, options: updatedOptions }
        }
        return p
      }))

    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: "Error",
        description: "Failed to register vote",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/chat')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Polls</h1>
        <div className="w-10" /> {/* Spacer for alignment */}
      </div>

      {/* Create Poll Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Poll</CardTitle>
          <CardDescription>Ask the community what they think</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div>
              <Input
                placeholder="Poll title"
                value={newPoll.title}
                onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Input
                placeholder="Description (optional)"
                value={newPoll.description}
                onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              {newPoll.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newPoll.options]
                      newOptions[index] = e.target.value
                      setNewPoll(prev => ({ ...prev, options: newOptions }))
                    }}
                  />
                  {index >= 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setNewPoll(prev => ({
                          ...prev,
                          options: prev.options.filter((_, i) => i !== index)
                        }))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {newPoll.options.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setNewPoll(prev => ({
                      ...prev,
                      options: [...prev.options, '']
                    }))
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Poll
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Polls List */}
      <div className="space-y-4">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0)
          const userVote = profile && poll.options.find(opt => opt.votes.includes(profile.id))

          return (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{poll.title}</CardTitle>
                  {poll.description && (
                    <CardDescription>{poll.description}</CardDescription>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Created {format(new Date(poll.created_at), 'MMM d, h:mm a')}
                    {' • '}
                    Ends {format(new Date(poll.ends_at), 'MMM d, h:mm a')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {poll.options.map((option) => {
                    const percentage = totalVotes > 0
                      ? (option.votes.length / totalVotes) * 100
                      : 0

                    return (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Button
                            variant={userVote?.id === option.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => handleVote(poll.id, option.id)}
                          >
                            {option.text}
                          </Button>
                          <span className="ml-2 text-sm text-muted-foreground">
                            {option.votes.length} votes
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
} 