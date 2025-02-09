export interface Channel {
  id: string
  name: string
  description: string
  created_by: string
  created_at: string
  is_locked: boolean
  locked_at?: string
  locked_by?: string
  authorized_users?: string[]
  allow_polls: boolean
  unreadCount?: number
  lastReadTimestamp?: string
  mentions?: number
}

export interface Admin {
  id: string
  user_id: string
  created_at: string
}

export interface ReplyTo {
  id: string
  content: string
  username: string
}

export interface Reaction {
  emoji: string
  count: number
  users: string[]
}

export interface Message {
  id: string
  content: string
  username: string
  user_id: string
  created_at: string
  user_avatar?: string
  image_url?: string
  reply_to?: ReplyTo
  reactions: Reaction[]
  is_pinned?: boolean
  edited_at?: string
  is_verified?: boolean
  channel_id: string
  pinned_at?: string
  pinned_by?: string
}

export interface User {
  id: string
  username: string
  avatar_url?: string | null
  is_verified?: boolean
  is_online: boolean
  role?: string
  created_at?: string
  updated_at?: string
}

export interface TypingIndicator {
  user_id: string
  username: string
  channel_id: string
  timestamp: string
} 