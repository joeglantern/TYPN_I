import { Hash, Lock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Channel } from '../types'

interface ChannelSidebarProps {
  channels: Channel[]
  currentChannel: string | null
  isAdmin: boolean
  onChannelSelect: (channelId: string) => void
  onCreateChannel: () => void
  unreadCounts?: Record<string, number>
  onMarkAsRead?: (channelId: string) => void
}

export function ChannelSidebar({
  channels,
  currentChannel,
  isAdmin,
  onChannelSelect,
  onCreateChannel,
  unreadCounts = {},
  onMarkAsRead
}: ChannelSidebarProps) {
  return (
    <div className="bg-muted/50 backdrop-blur-lg w-64 flex-shrink-0 flex flex-col h-full border-r">
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Channels</h2>
        </div>
        <Button
          onClick={onCreateChannel}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Channel
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {channels.map((channel) => {
            const isActive = channel.id === currentChannel
            const unreadCount = unreadCounts[channel.id] || 0
            
            return (
              <button
                key={channel.id}
                onClick={() => {
                  onChannelSelect(channel.id)
                  onMarkAsRead?.(channel.id)
                }}
                className={cn(
                  "w-full flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/15"
                )}
              >
                <Hash className={`h-4 w-4 ${
                  currentChannel === channel.id ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <span className="truncate flex-1 text-left">{channel.name}</span>
                {channel.is_locked && (
                  <Lock className={`h-3 w-3 ${
                    currentChannel === channel.id ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                )}
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    {unreadCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
} 

