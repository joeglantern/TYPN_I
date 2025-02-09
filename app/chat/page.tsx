'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MessageThread } from './components/MessageThread'
import { MessageInput } from './components/MessageInput'
import { ChannelSidebar } from './components/ChannelSidebar'
import { OnlineUsersSidebar } from './components/OnlineUsersSidebar'
import { ChannelHeader } from './components/ChannelHeader'
import { CreateChannelDialog } from './components/CreateChannelDialog'
import { ReportDialog } from './components/ReportDialog'
import { Channel, Message, ReplyTo, User, Reaction } from './types'
import { debounce } from 'lodash'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'
import { emitAuthStateChange } from '@/lib/events'
import { FcGoogle } from 'react-icons/fc'

export default function ChatPage() {
  const router = useRouter()

  // Core state
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannel, setCurrentChannel] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])

  // Message interaction state
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [channelLocked, setChannelLocked] = useState(false)

  // Dialog state
  const [showCreateChannel, setShowCreateChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportedMessage, setReportedMessage] = useState<Message | null>(null)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get realtime messages
  const { messages: realtimeMessages, error: messagesError, profileCache: messageProfileCache } = useRealtimeMessages(
    currentChannel || ''
  )

  // Add authorized users state
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([])

  // Add new state for user profile
  const [userProfile, setUserProfile] = useState<any>(null)

  // Add after other state declarations
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [lastReadMessage, setLastReadMessage] = useState<string | null>(null)

  // Add profile cache
  const [profileCache, setProfileCache] = useState<Record<string, any>>({})

  // Effects
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN') {
        try {
          setLoading(true)
          // First set the session immediately
          setSession(session)
          
          // Then fetch all required data in parallel
          if (session?.user?.id) {
            const [profileResult, channelsResult] = await Promise.all([
              fetchUserProfile(session.user.id),
              supabase.from('channels').select('*').order('name')
            ])

            if (!mounted) return;

            // Set user profile and admin status
            setUserProfile(profileResult)
            setIsAdmin(profileResult?.role === 'admin')
            
            // Set channels and initial channel
            const channels = channelsResult.data ?? []
            if (channels.length > 0) {
              setChannels(channels as Channel[])
              if (!currentChannel) {
                setCurrentChannel(channels[0].id)
              }
            }

            // Emit auth state change event
            emitAuthStateChange(session, profileResult?.role === 'admin')
          }
        } catch (error) {
          console.error('Error initializing after sign in:', error)
          toast.error('Error loading chat data')
        } finally {
          if (mounted) {
            setLoading(false)
          }
        }
      } else if (event === 'SIGNED_OUT') {
        // Reset all state immediately on sign out
        setSession(null)
        setIsAdmin(false)
        setUserProfile(null)
        setChannels([])
        setCurrentChannel(null)
        setMessages([])
        emitAuthStateChange(null, false)
        setLoading(false)
      }
    })

    // Initial load
    const initializeChat = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return;

        if (session?.user?.id) {
          setSession(session)
          
          // Fetch initial data in parallel
          const [profileResult, channelsResult] = await Promise.all([
            fetchUserProfile(session.user.id),
            supabase.from('channels').select('*').order('name')
          ])

          if (!mounted) return;

          // Set user data
          setUserProfile(profileResult)
          setIsAdmin(profileResult?.role === 'admin')
          
          // Set channels
          const channels = channelsResult.data ?? []
          if (channels.length > 0) {
            setChannels(channels as Channel[])
            setCurrentChannel(channels[0].id)
          }
        } else {
          // For non-authenticated users, just fetch channels
          const { data: channels } = await supabase
            .from('channels')
            .select('*')
            .order('name')

          if (!mounted) return;
          
          if (channels && Array.isArray(channels) && channels.length > 0) {
            setChannels(channels as Channel[])
            setCurrentChannel(channels[0].id)
          }
        }
      } catch (err) {
        console.error('Error initializing chat:', err)
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeChat()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Update channel initialization effect
  useEffect(() => {
    let mounted = true;

    if (currentChannel && session) {
      const initializeChannel = async () => {
        try {
          const results = await Promise.all([
            fetchMessages(),
            subscribeToTyping(),
            subscribeToPresence(),
            checkChannelLock(),
            checkAuthorizedUsers()
          ])

          if (!mounted) return;

          // Handle results if needed
        } catch (error) {
          console.error('Error initializing channel:', error)
          if (mounted) {
            toast.error('Error loading chat data')
          }
        }
      }

      initializeChannel()
    }

    return () => {
      mounted = false;
    }
  }, [currentChannel, session])

  useEffect(() => {
    if (realtimeMessages && !loading) {
      // Only update messages if we have new data
      if (JSON.stringify(messages) !== JSON.stringify(realtimeMessages)) {
        setMessages(realtimeMessages)
        // Update profile cache from realtime messages
        setProfileCache(prev => ({
          ...prev,
          ...messageProfileCache
        }))
        scrollToBottom()
      }
    }
  }, [realtimeMessages, messageProfileCache, loading])

  // Core functionality
  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name')
      
      if (error) throw error
      
      if (data?.length > 0) {
        setChannels(data)
        // Only set current channel if not already set
        if (!currentChannel) {
        setCurrentChannel(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
      throw error
    }
  }

  const fetchMessages = async (): Promise<void> => {
    if (!currentChannel) return

    try {
      const { data, error } = await supabase
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
        .eq('channel_id', currentChannel)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching messages:', error)
        throw new Error(error.message)
      }

      // Process messages and cache profiles
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

      // Update local state with new messages
      setMessages(processedMessages)
      scrollToBottom()
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch messages')
    }
  }

  const subscribeToTyping = () => {
    if (!currentChannel) return

    const channel = supabase.channel(`typing:${currentChannel}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const typingUsernames = new Set(
          Object.values(presenceState)
            .flat()
            .map((presence: any) => presence.username)
        )
        setTypingUsers(typingUsernames)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const subscribeToPresence = () => {
    if (!currentChannel) return

    const channel = supabase.channel(`presence:${currentChannel}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const users = Object.values(presenceState)
          .flat()
          .map((presence: any) => ({
            id: presence.user_id,
            username: presence.username,
            avatar_url: presence.avatar_url,
            is_online: true
          }))
        setOnlineUsers(users)
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleSendMessage = async (content: string, file?: File) => {
    if (!session?.user?.id || !currentChannel || (!content.trim() && !file)) return
    if (channelLocked && !isAdmin) {
      toast.error('This channel is locked')
      return
    }
    
    try {
      console.log('Attempting to send message:', { content, hasFile: !!file })
      
      let imageUrl = null
      if (file) {
        try {
          // First check if bucket exists
          const { data: buckets, error: bucketsError } = await supabase
            .storage
            .listBuckets()

          if (bucketsError) throw bucketsError

          const chatImagesBucket = buckets.find(b => b.name === 'chat-images')
          
          if (!chatImagesBucket) {
            // Create bucket if it doesn't exist
            const { error: createError } = await supabase
              .storage
              .createBucket('chat-images', {
                public: true,
                fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
              })
            
            if (createError) throw createError
          }

          // Now upload the file
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-images')
            .upload(`${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`, file, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (uploadError) throw uploadError
          
          // Get the public URL
          const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(uploadData.path)
          
          imageUrl = publicUrl
        } catch (error) {
          console.error('Error handling file upload:', error)
          throw new Error(error instanceof Error ? error.message : 'Failed to upload file')
        }
      }

      // Use cached profile if available, otherwise fetch it
      let profile = profileCache[session.user.id]
      if (!profile) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url, is_verified')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          throw new Error(profileError.message)
        }
        profile = data
        // Update cache
        setProfileCache(prev => ({
          ...prev,
          [session.user.id]: profile
        }))
      }

      // If no avatar_url in profile, use Google avatar from session
      const avatarUrl = profile?.avatar_url || session.user?.user_metadata?.avatar_url || null

      const messageData = {
        content: content.trim(),
        user_id: session.user.id,
        username: profile?.username || session.user.email?.split('@')[0] || 'Anonymous',
        user_avatar: avatarUrl,
        channel_id: currentChannel,
        image_url: imageUrl,
        reply_to: replyTo ? {
          id: replyTo.id,
          content: replyTo.content,
          username: replyTo.username
        } : null,
        reactions: []
      }

      console.log('Sending message with data:', messageData)

      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert([messageData])
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url,
            is_verified,
            role
          )
        `)
        .single()

      if (insertError) {
        console.error('Error inserting message:', insertError)
        throw new Error(insertError.message)
      }

      // Update local state with the new message
      if (newMessage) {
        const processedMessage = {
          ...newMessage,
          username: profile?.username || newMessage.username,
          user_avatar: avatarUrl,
          is_verified: profile?.is_verified || false
        }
        setMessages(prevMessages => [...prevMessages, processedMessage])
      }

      setReplyTo(null)
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send message')
    }
  }

  const handleCreateChannel = async () => {
    if (!session?.user?.id || !newChannelName.trim()) return

    try {
      const { error } = await supabase
        .from('channels')
        .insert([{
          name: newChannelName,
          description: newChannelDescription,
          created_by: session.user.id,
          is_locked: false,
          allow_polls: true
        }])

      if (error) throw error

      toast.success('Channel created successfully')
      setShowCreateChannel(false)
      setNewChannelName('')
      setNewChannelDescription('')
      fetchChannels()
    } catch (error) {
      console.error('Error creating channel:', error)
      toast.error('Failed to create channel')
    }
  }

  const handlePinMessage = async (messageId: string) => {
    if (!isAdmin || !session?.user?.id) {
      console.log('Pin message permission denied:', { isAdmin, userId: session?.user?.id })
      return
    }

    try {
      console.log('Attempting to toggle message pin:', { messageId, isAdmin })
      
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('is_pinned, content')
        .eq('id', messageId)
        .single()

      if (fetchError) {
        console.error('Error fetching message:', fetchError)
        toast.error('Error updating pin status')
        return
      }

      const { error: updateError } = await supabase
        .from('messages')
        .update({ 
          is_pinned: !message?.is_pinned,
          pinned_at: !message?.is_pinned ? new Date().toISOString() : null,
          pinned_by: !message?.is_pinned ? session.user.id : null
        })
        .eq('id', messageId)

      if (updateError) {
        console.error('Error updating message:', updateError)
        throw updateError
      }

      toast.success(message?.is_pinned ? 
        'Message unpinned' : 
        'Message pinned'
      )
      
      // Refresh messages to show updated pin status
      await fetchMessages()
    } catch (error) {
      console.error('Error toggling pin status:', error)
      toast.error('Failed to update pin status')
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!session?.user?.id) return

    try {
      const { data: message } = await supabase
        .from('messages')
        .select('user_id')
        .eq('id', messageId)
        .single()

      // Only allow users to edit their own messages
      if (!message || message.user_id !== session.user.id) {
        toast.error('You can only edit your own messages')
        return
      }

      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) throw error
      toast.success('Message updated')
      fetchMessages()
    } catch (error) {
      console.error('Error editing message:', error)
      toast.error('Failed to edit message')
    }
  }

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!session?.user?.id) return

    try {
      // Get the current reactions for this message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single()

      if (messageError) throw messageError

      let reactions: Reaction[] = message.reactions || []
      const existingReactionIndex = reactions.findIndex(
        (reaction: Reaction) => reaction.emoji === emoji && reaction.users.includes(session.user.id)
      )

      if (existingReactionIndex > -1) {
        // Remove user from existing reaction
        reactions[existingReactionIndex].users = reactions[existingReactionIndex].users
          .filter((userId: string) => userId !== session.user.id)
        reactions[existingReactionIndex].count--

        // Remove reaction if no users left
        if (reactions[existingReactionIndex].count === 0) {
          reactions = reactions.filter((_: Reaction, index: number) => index !== existingReactionIndex)
        }
      } else {
        // Add new reaction or update existing one
        const existingEmoji = reactions.find((reaction: Reaction) => reaction.emoji === emoji)
        if (existingEmoji) {
          existingEmoji.users.push(session.user.id)
          existingEmoji.count++
        } else {
          reactions.push({
            emoji,
            count: 1,
            users: [session.user.id]
          })
        }
      }

      // Update message with new reactions
      const { error: updateError } = await supabase
        .from('messages')
        .update({ reactions })
        .eq('id', messageId)

      if (updateError) throw updateError
      fetchMessages()
    } catch (error) {
      console.error('Error reacting to message:', error)
      toast.error('Failed to react to message')
    }
  }

  const handleReport = (message: Message) => {
    setReportedMessage(message)
    setShowReportDialog(true)
  }

  const handleSubmitReport = async () => {
    if (!reportedMessage || !reportReason.trim() || !session?.user?.id) return

    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          message_id: reportedMessage.id,
          reporter_id: session.user.id,
          reason: reportReason,
          status: 'pending'
        })

      if (error) throw error
      toast.success('Report submitted')
      setShowReportDialog(false)
      setReportReason('')
      setReportedMessage(null)
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const debouncedTyping = useCallback(
    debounce(async () => {
      if (!currentChannel || !session?.user?.id) return
      
      try {
        const channel = supabase.channel(`typing:${currentChannel}`)
        await channel.subscribe()
        await channel.track({
          user_id: session.user.id,
          username: session.user.email?.split('@')[0] || 'Anonymous',
          typing: true
        })

        // Remove typing indicator after 2 seconds
        setTimeout(async () => {
          await channel.untrack()
        }, 2000)
      } catch (error) {
        console.error('Error updating typing status:', error)
      }
    }, 500),
    [currentChannel, session?.user?.id]
  )

  const handleDeleteMessage = async (messageId: string) => {
    if (!session?.user?.id) return

    try {
      console.log('Attempting to delete message:', { messageId, isAdmin })
      
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('user_id, content')
        .eq('id', messageId)
        .single()

      if (fetchError) {
        console.error('Error fetching message:', fetchError)
        throw new Error(fetchError.message)
      }

      // Only allow users to delete their own messages or admins to delete any message
      if (!message || (!isAdmin && message.user_id !== session.user.id)) {
        console.log('Delete permission denied:', { 
          isAdmin, 
          messageUserId: message?.user_id, 
          currentUserId: session.user.id 
        })
        throw new Error('You do not have permission to delete this message')
      }

      // Update message with deleted_at timestamp instead of deleting
      const { error: deleteError } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)

      if (deleteError) {
        console.error('Error deleting message:', deleteError)
        throw new Error(deleteError.message)
      }
      
      // Update local state to remove the deleted message
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete message')
    }
  }

  const handleBanUser = async (userId: string, reason: string) => {
    if (!isAdmin || !session?.user?.id) {
      console.log('Ban user permission denied:', { isAdmin, adminId: session?.user?.id })
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for banning')
      return
    }

    try {
      console.log('Attempting to ban user:', { userId, adminId: session.user.id, channelId: currentChannel })

      // First check if user is already banned
      const { data: existingBan, error: checkError } = await supabase
        .from('banned_users')
        .select('*')
        .eq('user_id', userId)
        .eq('channel_id', currentChannel)
        .is('unbanned_at', null)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking existing ban:', checkError)
        toast.error('Error checking ban status')
        return
      }

      if (existingBan) {
        toast.error('User is already banned from this channel')
        return
      }

      // Get user's profile for the success message
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
      }

      const { error: banError } = await supabase
        .from('banned_users')
        .insert({
          user_id: userId,
          admin_id: session.user.id,
          reason,
          channel_id: currentChannel,
          created_at: new Date().toISOString()
        })

      if (banError) {
        console.error('Error banning user:', banError)
        throw banError
      }

      toast.success(`User ${userProfile?.username || 'Unknown'} has been banned`)
      
      // Update profiles table to mark user as banned
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_banned: true })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating user profile:', updateError)
      }
    } catch (error) {
      console.error('Error banning user:', error)
      toast.error('Failed to ban user')
    }
  }

  const handleLockChannel = async (channelId: string) => {
    if (!isAdmin || !session?.user?.id) {
      console.log('Lock channel permission denied:', { isAdmin, userId: session?.user?.id })
      return
    }

    try {
      console.log('Attempting to toggle channel lock:', { channelId, isAdmin })
      
      // First check if the channel exists and get its current state
      const { data: channel, error: fetchError } = await supabase
        .from('channels')
        .select('is_locked, name')
        .eq('id', channelId)
        .single()

      if (fetchError) {
        console.error('Error fetching channel:', fetchError)
        toast.error('Error updating channel')
        return
      }

      if (!channel) {
        toast.error('Channel not found')
        return
      }

      // Use the toggle_channel_lock function
      const { error: toggleError } = await supabase
        .rpc('toggle_channel_lock', {
          p_channel_id: channelId,
          p_user_id: session.user.id
        })

      if (toggleError) {
        console.error('Error toggling channel lock:', toggleError)
        throw toggleError
      }

      // Update local state
      setChannelLocked(!channel.is_locked)
      toast.success(channel.is_locked ? 
        `Channel "${channel.name}" unlocked` : 
        `Channel "${channel.name}" locked`
      )
      
      // Refresh channel data
      await Promise.all([
        fetchChannels(),
        checkChannelLock()
      ])
    } catch (error) {
      console.error('Error toggling channel lock:', error)
      toast.error('Failed to update channel lock')
    }
  }

  const checkChannelLock = async () => {
    if (!currentChannel) return

    try {
      const { data: channel, error } = await supabase
        .from('channels')
        .select('is_locked')
        .eq('id', currentChannel)
        .single()

      if (error) {
        console.error('Error checking channel lock:', error)
        return
      }

      setChannelLocked(!!channel?.is_locked)
    } catch (error) {
      console.error('Error checking channel lock:', error)
    }
  }

  const checkAuthorizedUsers = async () => {
    if (!currentChannel) return

    try {
      const { data: channel } = await supabase
        .from('channels')
        .select('authorized_users')
        .eq('id', currentChannel)
        .single()

      setAuthorizedUsers(channel?.authorized_users || [])
    } catch (error) {
      console.error('Error checking authorized users:', error)
    }
  }

  const handleAuthorizeUser = async (userId: string) => {
    if (!isAdmin || !currentChannel) return

    try {
      const { data: channel } = await supabase
        .from('channels')
        .select('authorized_users')
        .eq('id', currentChannel)
        .single()

      const currentAuthorizedUsers = channel?.authorized_users || []
      const newAuthorizedUsers = currentAuthorizedUsers.includes(userId)
        ? currentAuthorizedUsers.filter((id: string) => id !== userId)
        : [...currentAuthorizedUsers, userId]

      const { error } = await supabase
        .from('channels')
        .update({ authorized_users: newAuthorizedUsers })
        .eq('id', currentChannel)

      if (error) throw error
      
      setAuthorizedUsers(newAuthorizedUsers)
      toast.success(
        currentAuthorizedUsers.includes(userId)
          ? 'User unauthorized from locked channel'
          : 'User authorized in locked channel'
      )
    } catch (error) {
      console.error('Error updating authorized users:', error)
      toast.error('Failed to update user authorization')
    }
  }

  // Add function to fetch user profile
  const fetchUserProfile = async (userId: string) => {
    // Return cached profile if available
    if (profileCache[userId]) {
      return profileCache[userId]
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      // Cache the profile
      setProfileCache(prev => ({
        ...prev,
        [userId]: profile
      }))

      return profile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Add after other function declarations
  const markMessagesAsRead = async (channelId: string) => {
    if (!session?.user?.id) return

    try {
      // Get the latest message ID
      const latestMessage = messages[messages.length - 1]
      if (!latestMessage) return

      // Update the channel_reads table with ON CONFLICT handling
      const { error } = await supabase
        .from('channel_reads')
        .upsert(
          {
            channel_id: channelId,
            user_id: session.user.id,
            last_read: new Date().toISOString(),
            last_read_message_id: latestMessage.id
          },
          {
            onConflict: 'channel_id,user_id',
            ignoreDuplicates: false
          }
        )

      if (error) {
        console.error('Error marking messages as read:', error)
        throw new Error(error.message)
      }

      // Update local state
      setUnreadCounts(prev => ({
        ...prev,
        [channelId]: 0
      }))
    } catch (error) {
      console.error('Error marking messages as read:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to mark messages as read')
    }
  }

  const fetchUnreadCounts = async () => {
    if (!session?.user?.id) return

    try {
      // Get all channel reads for the user
      const { data: channelReads, error: readsError } = await supabase
        .from('channel_reads')
        .select('channel_id, last_read')
        .eq('user_id', session.user.id)

      if (readsError) {
        console.error('Error fetching channel reads:', readsError)
        throw new Error(readsError.message)
      }

      // Get message counts since last read for each channel
      const counts: Record<string, number> = {}
      await Promise.all(
        channels.map(async (channel) => {
          try {
            const channelRead = channelReads?.find((r: { channel_id: string }) => r.channel_id === channel.id)
            if (!channelRead) {
              // If never read, count all messages except user's own
              const { count, error: countError } = await supabase
                .from('messages')
                .select('id', { count: 'exact' })
                .eq('channel_id', channel.id)
                .not('user_id', 'eq', session.user.id) // Don't count user's own messages
                .not('user_id', 'is', null)

              if (countError) throw countError
              counts[channel.id] = count || 0
            } else {
              // Count messages since last read, excluding user's own
              const { count, error: countError } = await supabase
                .from('messages')
                .select('id', { count: 'exact' })
                .eq('channel_id', channel.id)
                .not('user_id', 'eq', session.user.id) // Don't count user's own messages
                .gt('created_at', channelRead.last_read)
                .not('user_id', 'is', null)

              if (countError) throw countError
              counts[channel.id] = count || 0
            }
          } catch (error) {
            console.error(`Error counting messages for channel ${channel.id}:`, error)
            counts[channel.id] = 0
          }
        })
      )

      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error fetching unread counts:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch unread counts')
    }
  }

  const getUnreadMarker = async (channelId: string) => {
    if (!session?.user?.id) return null

    try {
      // Get the last read message for this channel
      const { data: channelRead } = await supabase
        .from('channel_reads')
        .select('last_read')
        .eq('channel_id', channelId)
        .eq('user_id', session.user.id)
        .single()

      if (!channelRead?.last_read) return messages[0]?.id || null

      // Find the first message after the last read time
      const firstUnread = messages.find(
        msg => msg.user_id && new Date(msg.created_at) > new Date(channelRead.last_read)
      )
      return firstUnread?.id || null
    } catch (error) {
      console.error('Error getting unread marker:', error)
      return null
    }
  }

  // Add useEffect to fetch unread counts when channels change
  useEffect(() => {
    if (session?.user?.id && channels.length > 0) {
      fetchUnreadCounts()
    }
  }, [channels, session?.user?.id])

  // Add this effect to mark messages as read when viewing a channel
  useEffect(() => {
    if (currentChannel && session?.user?.id) {
      markMessagesAsRead(currentChannel)
    }
  }, [currentChannel, session?.user?.id])

  // Add this effect to update unread counts when new messages arrive
  useEffect(() => {
    if (realtimeMessages && currentChannel && session?.user?.id) {
      // Update unread counts for other channels
      fetchUnreadCounts()
      // Mark current channel as read
      markMessagesAsRead(currentChannel)
    }
  }, [realtimeMessages, currentChannel, session?.user?.id])

  // Move currentChannelData declaration here, before any returns
  const currentChannelData = channels.find(c => c.id === currentChannel)

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-red-500">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen bg-background">
        {/* Channels Sidebar */}
        <div className={cn(
          "w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          !isSidebarOpen && "hidden"
        )}>
          <ChannelSidebar
            channels={channels}
            currentChannel={currentChannel}
            isAdmin={false}
            onChannelSelect={(channelId) => setCurrentChannel(channelId)}
            onCreateChannel={() => {
              toast.error('Please sign in to create channels')
            }}
            unreadCounts={{}}
            onMarkAsRead={() => {}}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChannelHeader
            channel={currentChannelData}
            isAdmin={false}
            onlineUsers={[]}
            authorizedUsers={[]}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onToggleSearch={() => {}}
            onToggleOnlineUsers={() => {}}
            onToggleLock={() => toast.error('Please sign in to manage channels')}
            onAuthorizeUser={async () => {
              toast.error('Please sign in to manage users')
              return
            }}
            isAuthenticated={false}
          />

          {/* Messages */}
          <div className="flex-1 overflow-hidden bg-gradient-to-b from-background to-background/95">
            <MessageThread
              messages={messages}
              onReaction={() => toast.error('Please sign in to react to messages')}
              onDelete={() => toast.error('Please sign in to delete messages')}
              onEdit={() => toast.error('Please sign in to edit messages')}
              onReply={() => toast.error('Please sign in to reply to messages')}
              onReport={() => toast.error('Please sign in to report messages')}
              onPin={() => Promise.resolve()}
              onBan={(userId: string) => Promise.resolve()}
              onAuthorize={() => Promise.resolve()}
              currentUser={null}
              isAdmin={false}
              isAuthorizedInLocked={false}
              isLoading={loading}
              hasMore={true}
              onLoadMore={async () => {
                try {
                  await fetchMessages()
                } catch (error) {
                  console.error('Error loading more messages:', error)
                }
              }}
              isAuthenticated={false}
            />
          </div>

          {/* Sign In Prompt */}
          <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Join the Conversation</h3>
                <p className="text-sm text-muted-foreground mt-1">Sign in to send messages, react, and more</p>
              </div>
              <Button 
                onClick={() => router.push('/auth/login')}
                className="bg-primary text-white hover:bg-primary/90"
                size="lg"
              >
                Sign In to Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Channels Sidebar */}
      <div className={cn(
        "w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        !isSidebarOpen && "hidden"
      )}>
        <ChannelSidebar
          channels={channels}
          currentChannel={currentChannel}
          isAdmin={isAdmin}
          onChannelSelect={(channelId) => {
            setCurrentChannel(channelId)
            if (session?.user?.id) {
              markMessagesAsRead(channelId)
            }
          }}
          onCreateChannel={() => {
            if (!session) {
              toast.error('Please sign in to create channels')
              return
            }
            setShowCreateChannel(true)
          }}
          unreadCounts={unreadCounts}
          onMarkAsRead={markMessagesAsRead}
        />
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChannelHeader
          channel={currentChannelData}
          isAdmin={isAdmin}
          onlineUsers={onlineUsers}
          authorizedUsers={authorizedUsers}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleSearch={() => setShowSearch(!showSearch)}
          onToggleOnlineUsers={() => setShowOnlineUsers(!showOnlineUsers)}
          onToggleLock={(channelId) => {
            if (!session) {
              toast.error('Please sign in to manage channels')
              return
            }
            handleLockChannel(channelId)
          }}
          onAuthorizeUser={handleAuthorizeUser}
          isAuthenticated={!!session}
        />

        {/* Search Bar */}
        {showSearch && (
          <div className="p-2 border-b">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md mx-auto"
            />
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-background to-background/95">
          <MessageThread
            messages={messages}
            onReaction={(messageId, emoji) => {
              if (!session) {
                toast.error('Please sign in to react to messages')
                return
              }
              handleReactToMessage(messageId, emoji)
            }}
            onDelete={(messageId) => {
              if (!session) {
                toast.error('Please sign in to delete messages')
                return
              }
              handleDeleteMessage(messageId)
            }}
            onEdit={(messageId, content) => {
              if (!session) {
                toast.error('Please sign in to edit messages')
                return
              }
              handleEditMessage(messageId, content)
            }}
            onReply={(message) => {
              if (!session) {
                toast.error('Please sign in to reply to messages')
                return
              }
              setReplyTo(message)
            }}
            onReport={(message) => {
              if (!session) {
                toast.error('Please sign in to report messages')
                return
              }
              handleReport(message)
            }}
            onPin={handlePinMessage}
            onBan={(userId: string) => Promise.resolve()}
            onAuthorize={handleAuthorizeUser}
            currentUser={session ? {
              ...session?.user,
              ...userProfile,
              username: userProfile?.username || session?.user?.email?.split('@')[0] || 'Anonymous',
              avatar_url: userProfile?.avatar_url
            } : null}
            isAdmin={isAdmin}
            isAuthorizedInLocked={authorizedUsers.includes(session?.user?.id)}
            isLoading={loading}
            hasMore={true}
            onLoadMore={async () => {
              try {
                await fetchMessages()
              } catch (error) {
                console.error('Error loading more messages:', error)
              }
            }}
            isAuthenticated={!!session}
          />
        </div>

        {/* Message Input - Only show if authenticated */}
        {session ? (
          <>
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="px-4 py-1 text-sm text-muted-foreground bg-muted/50 border-t">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            {/* Message Input */}
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <MessageInput
                onSend={handleSendMessage}
                onTyping={debouncedTyping}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                disabled={channelLocked && !isAdmin}
                placeholder={channelLocked ? 'This channel is locked' : 'Type a message...'}
              />
            </div>
          </>
        ) : (
          <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Join the Conversation</h3>
                <p className="text-sm text-muted-foreground mt-1">Sign in to send messages, react, and more</p>
              </div>
              <Button 
                onClick={() => router.push('/auth/login')}
                className="bg-white text-gray-900 hover:bg-gray-100 border shadow-sm"
                size="lg"
              >
                <FcGoogle className="mr-2 h-5 w-5" />
                Continue with Google
              </Button>
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Online Users Sidebar - Hidden on mobile, slides in from right */}
      <div className={`fixed inset-y-0 right-0 z-20 transform ${
        showOnlineUsers ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
        showOnlineUsers ? 'md:block' : 'md:hidden'
      }`}>
        <OnlineUsersSidebar users={onlineUsers} />
      </div>

      {/* Backdrop for mobile online users sidebar */}
      {showOnlineUsers && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setShowOnlineUsers(false)}
        />
      )}

      {/* Dialogs */}
      <CreateChannelDialog
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
        channelName={newChannelName}
        onChannelNameChange={setNewChannelName}
        channelDescription={newChannelDescription}
        onChannelDescriptionChange={setNewChannelDescription}
        onSubmit={handleCreateChannel}
      />

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reason={reportReason}
        onReasonChange={setReportReason}
        onSubmit={handleSubmitReport}
      />

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  )
} 



