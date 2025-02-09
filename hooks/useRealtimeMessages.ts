import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Message } from '@/app/chat/types'

const MESSAGES_PER_PAGE = 50

export function useRealtimeMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [profileCache, setProfileCache] = useState<Record<string, any>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const lastMessageRef = useRef<string | null>(null)
  const channelRef = useRef<string | null>(null)

  // Reset state when channel changes
  useEffect(() => {
    if (channelId !== channelRef.current) {
      setMessages([])
      setHasMore(true)
      lastMessageRef.current = null
      channelRef.current = channelId
    }
  }, [channelId])

  // Memoize the fetch messages function
  const fetchMessages = useCallback(async (lastId?: string) => {
    if (!channelId) return

    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            is_verified,
            role
          )
        `)
        .eq('channel_id', channelId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE)

      if (lastId) {
        query = query.lt('id', lastId)
      }

      const { data, error } = await query

      if (error) throw error

      // Process messages and cache profiles efficiently
      const processedMessages = data?.map(msg => {
        const profile = msg.profiles
        delete msg.profiles
        
        // Cache the profile
        if (profile) {
          setProfileCache(prev => ({
            ...prev,
            [msg.user_id]: profile
          }))
        }

        return {
          ...msg,
          username: profile?.username || msg.username,
          user_avatar: profile?.avatar_url || msg.user_avatar,
          is_verified: profile?.is_verified || false
        }
      }) || []

      setHasMore(processedMessages.length === MESSAGES_PER_PAGE)
      
      if (lastId) {
        setMessages(prev => [...prev, ...processedMessages])
      } else {
        setMessages(processedMessages)
      }
      
      if (processedMessages.length > 0) {
        lastMessageRef.current = processedMessages[processedMessages.length - 1].id
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError(error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [channelId])

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !lastMessageRef.current) return
    await fetchMessages(lastMessageRef.current)
  }, [fetchMessages, hasMore, isLoading])

  useEffect(() => {
    if (!channelId) return

    fetchMessages()

    const channel = supabase
      .channel(`messages:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const { data: newMessage, error } = await supabase
                .from('messages')
                .select(`
                  *,
                  profiles:user_id (
                    username,
                    avatar_url,
                    is_verified,
                    role
                  )
                `)
                .eq('id', payload.new.id)
                .single()

              if (error) throw error

              if (newMessage) {
                const profile = newMessage.profiles
                delete newMessage.profiles

                if (profile) {
                  setProfileCache(prev => ({
                    ...prev,
                    [newMessage.user_id]: profile
                  }))
                }

                const processedMessage = {
                  ...newMessage,
                  username: profile?.username || newMessage.username,
                  user_avatar: profile?.avatar_url || newMessage.user_avatar,
                  is_verified: profile?.is_verified || false
                }

                setMessages(prev => [processedMessage, ...prev])
              }
            } else if (payload.eventType === 'UPDATE') {
              setMessages(prev =>
                prev.map((msg) => {
                  if (msg.id === payload.new.id) {
                    if (payload.new.deleted_at) return null
                    const profile = profileCache[msg.user_id]
                    return {
                      ...msg,
                      ...payload.new,
                      username: profile?.username || msg.username,
                      user_avatar: profile?.avatar_url || msg.user_avatar,
                      is_verified: profile?.is_verified || false
                    }
                  }
                  return msg
                }).filter(Boolean) as Message[]
              )
            }
          } catch (error) {
            console.error('Error handling realtime message:', error)
            setError(error as Error)
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [channelId, fetchMessages])

  return { 
    messages, 
    error, 
    profileCache, 
    isLoading, 
    hasMore, 
    loadMore,
    refetch: fetchMessages
  }
} 