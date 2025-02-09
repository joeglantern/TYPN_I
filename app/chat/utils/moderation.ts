import { supabase } from '@/lib/supabase'

// List of bad words (this is a basic example, you should use a more comprehensive list)
const badWords = [
  'badword1',
  'badword2',
  // Add more bad words here
]

// Function to check if text contains bad words
export function containsBadWords(text: string): { hasBadWords: boolean; words: string[] } {
  const lowerText = text.toLowerCase()
  const foundWords = badWords.filter(word => lowerText.includes(word.toLowerCase()))
  return {
    hasBadWords: foundWords.length > 0,
    words: foundWords
  }
}

// Function to censor bad words in text
export function censorBadWords(text: string): string {
  let censoredText = text
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi')
    censoredText = censoredText.replace(regex, '*'.repeat(word.length))
  })
  return censoredText
}

interface BanStatus {
  isBanned: boolean;
  error?: string;
  reason?: string;
  admin?: string;
  isGlobalBan?: boolean;
  banDate?: string;
}

// Function to check if user is banned
export async function checkBanStatus(userId: string, channelId: string): Promise<BanStatus> {
  if (!userId) return { isBanned: false };
  
  try {
    // First check for global bans
    const { data: globalBan, error: globalError } = await supabase
      .from('banned_users')
      .select(`
        *,
        admin:admin_id(username)
      `)
      .eq('user_id', userId)
      .is('channel_id', null)
      .is('unbanned_at', null)
      .maybeSingle();

    if (globalError) {
      console.error('Error checking global ban status:', globalError);
      return {
        isBanned: false,
        error: 'Failed to check ban status'
      };
    }

    // If there's a global ban, return it immediately
    if (globalBan) {
      return {
        isBanned: true,
        reason: globalBan.reason || 'Account suspended',
        admin: globalBan.admin?.username || 'System',
        isGlobalBan: true,
        banDate: globalBan.created_at
      };
    }

    // Only check for channel-specific bans if a channel ID is provided
    if (channelId) {
      const { data: channelBan, error: channelError } = await supabase
        .from('banned_users')
        .select(`
          *,
          admin:admin_id(username)
        `)
        .eq('user_id', userId)
        .eq('channel_id', channelId)
        .is('unbanned_at', null)
        .maybeSingle();

      if (channelError) {
        console.error('Error checking channel ban status:', channelError);
        return {
          isBanned: false,
          error: 'Failed to check ban status'
        };
      }

      if (channelBan) {
        return {
          isBanned: true,
          reason: channelBan.reason || 'Channel ban',
          admin: channelBan.admin?.username || 'Channel Moderator',
          isGlobalBan: false,
          banDate: channelBan.created_at
        };
      }
    }

    return {
      isBanned: false
    };
  } catch (error) {
    console.error('Error in checkBanStatus:', error);
    return {
      isBanned: false,
      error: 'Failed to check ban status'
    };
  }
}

// Function to ban user
export async function banUser(userId: string, reason: string, adminId: string, channelId?: string) {
  if (!userId || !reason || !adminId) {
    throw new Error('Missing required parameters for banning user')
  }

  try {
    const { data, error } = await supabase.rpc('ban_user', {
      p_user_id: userId,
      p_admin_id: adminId,
      p_reason: reason,
      p_channel_id: channelId || null
    })

    if (error) {
      console.error('Error in ban_user RPC:', error)
      throw new Error(error.message || 'Failed to ban user')
    }

    return true
  } catch (error: any) {
    console.error('Error banning user:', error)
    throw error
  }
}

// Function to unban user
export async function unbanUser(userId: string, adminId: string, channelId?: string) {
  try {
    const { error } = await supabase.rpc('unban_user', {
      p_user_id: userId,
      p_admin_id: adminId,
      p_channel_id: channelId
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error unbanning user:', error)
    return false
  }
}

// Function to get banned users
export async function getBannedUsers(channelId?: string) {
  try {
    const query = supabase
      .from('banned_users')
      .select(`
        *,
        banned_by:profiles!banned_users_banned_by_fkey(username),
        user:profiles!banned_users_user_id_fkey(username)
      `)
      .is('unbanned_at', null)

    if (channelId) {
      query.eq('channel_id', channelId)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting banned users:', error)
    return []
  }
} 