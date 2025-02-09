import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle } from 'lucide-react'

interface User {
  id: string
  username: string
  avatar_url?: string | null
  is_verified?: boolean
  is_online: boolean
}

interface OnlineUsersSidebarProps {
  users: User[]
}

export function OnlineUsersSidebar({ users }: OnlineUsersSidebarProps) {
  return (
    <div className="w-64 h-full border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Online Users ({users.length})</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-2 space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50"
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">
                    {user.username}
                  </span>
                  {user.is_verified && (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 