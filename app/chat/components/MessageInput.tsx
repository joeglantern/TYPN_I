import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Smile, Paperclip, Send, X } from 'lucide-react'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { ReplyTo } from '../types'

interface MessageInputProps {
  onSend: (content: string, file?: File) => void
  onTyping: () => void
  replyTo: ReplyTo | null
  onCancelReply: () => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInput({
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Type a message...'
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (message.trim() || selectedFile) {
      onSend(message, selectedFile || undefined)
      setMessage('')
      setSelectedFile(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native)
  }

  return (
    <div className="p-2">
      {replyTo && (
        <div className="mb-2 flex items-center text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
          <span className="mr-1">Replying to</span>
          <span className="font-medium">{replyTo.username}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-2 hover:bg-muted"
            onClick={onCancelReply}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      {selectedFile && (
        <div className="mb-2 flex items-center bg-muted/50 p-2 rounded-md">
          <span className="text-sm">{selectedFile.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2 hover:bg-muted"
            onClick={() => setSelectedFile(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex items-end space-x-2 bg-muted/30 rounded-lg p-2">
        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            onTyping()
          }}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[20px] max-h-[200px] bg-transparent border-0 focus-visible:ring-0 resize-none px-2 py-1"
          rows={1}
        />
        <div className="flex items-center space-x-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-auto p-0">
              <Picker 
                data={data} 
                onEmojiSelect={handleEmojiSelect}
                theme="light"
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />
          <Button
            size="icon"
            className="h-8 w-8 bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={disabled || (!message.trim() && !selectedFile)}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
