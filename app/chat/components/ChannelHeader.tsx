import { Menu, Search, Users, Lock, Unlock, Shield, UserCheck, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Channel, User } from '../types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChannelHeaderProps {
  channel: Channel | undefined
  isAdmin: boolean
  onlineUsers: User[]
  authorizedUsers: string[]
  onToggleSidebar: () => void
  onToggleSearch: () => void
  onToggleOnlineUsers: () => void
  onToggleLock: (channelId: string) => void
  onAuthorizeUser: (userId: string) => Promise<void>
  isAuthenticated?: boolean
}

export function ChannelHeader({
  channel,
  isAdmin,
  onlineUsers,
  authorizedUsers,
  onToggleSidebar,
  onToggleSearch,
  onToggleOnlineUsers,
  onToggleLock,
  onAuthorizeUser,
  isAuthenticated = false
}: ChannelHeaderProps) {
  return (
    <motion.div 
      className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hover:rotate-180 transition-transform duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <motion.div className="flex items-center gap-2">
            <h3 className="font-semibold">{channel?.name}</h3>
            {isAdmin && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </motion.div>
          {channel?.is_locked && (
            <Badge variant="destructive" className="gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
          <motion.p 
            className="text-xs text-muted-foreground hidden sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {channel?.description}
          </motion.p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isAuthenticated && isAdmin && channel && (
          <div className="flex items-center gap-2">
            <Button
              variant={channel.is_locked ? "destructive" : "secondary"}
              size="sm"
              onClick={() => onToggleLock(channel.id)}
              className="gap-2 font-semibold"
            >
              {channel.is_locked ? (
                <>
                  <Unlock className="h-4 w-4" />
                  <span className="hidden sm:inline">Unlock Channel</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Lock Channel</span>
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Controls</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Channel Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onToggleLock(channel.id)}>
                  {channel.is_locked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Channel
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Channel
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Authorized Users</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {onlineUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => onAuthorizeUser(user.id)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className={cn(
                        "h-4 w-4",
                        authorizedUsers.includes(user.id) ? "text-primary" : "text-muted-foreground"
                      )} />
                      {user.username}
                    </span>
                    {authorizedUsers.includes(user.id) && (
                      <Badge variant="secondary" className="ml-2">Authorized</Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <motion.div 
          className="flex items-center space-x-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSearch}
            className="hover:rotate-12 transition-transform duration-200"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleOnlineUsers}
            className="hover:rotate-12 transition-transform duration-200"
          >
            <Users className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
} 
