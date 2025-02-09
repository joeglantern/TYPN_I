import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Message } from '@/app/chat/types'

export function useRealtimeMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!channelId) return

    // Initial fetch
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('channel_id', channelId)
          .not('user_id', 'is', null) // Only fetch messages with valid user_id
          .order('created_at', { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (err) {
        console.error('Error fetching messages:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch messages'))
      }
    }

    fetchMessages()

    // Set up realtime subscription
    const channel = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        // Only add messages with valid user_id
        if (payload.new && payload.new.user_id) {
          setMessages(current => [...current, payload.new as Message])
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        console.log('Message deleted:', payload.old.id)
        setMessages(current => current.filter(msg => msg.id !== payload.old.id))
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        console.log('Message updated:', payload.new)
        // Only update messages with valid user_id
        if (payload.new && payload.new.user_id) {
          setMessages(current =>
            current.map(msg =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          )
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    return () => {
      channel.unsubscribe()
    }
  }, [channelId])

  return { messages, error }
} 