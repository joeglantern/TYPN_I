import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Message } from '../types'

interface MessageReplyProps {
  message: Message
  onCancel: () => void
}

export function MessageReply({ message, onCancel }: MessageReplyProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-1 h-8 bg-primary rounded-full" />
        <div>
          <p className="text-sm font-medium">{message.username}</p>
          <p className="text-sm text-muted-foreground line-clamp-1">{message.content}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onCancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
