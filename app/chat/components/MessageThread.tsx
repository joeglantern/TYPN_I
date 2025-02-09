import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { 
  Reply, Pin, MoreVertical, Edit2, Smile, Trash2, Ban,
  Flag, Check, X, BadgeCheck, Shield, CheckCircle, Loader2
} from 'lucide-react'
import { Message } from '../types'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog"
import { format } from 'date-fns'
import { useInView } from 'react-intersection-observer'
import Image from 'next/image'

interface MessageThreadProps {
  messages: Message[]
  onReaction: (messageId: string, emoji: string) => void
  onDelete: (messageId: string) => void
  onEdit: (messageId: string, content: string) => void
  onReply: (message: Message) => void
  onReport: (message: Message) => void
  onPin: (messageId: string) => void
  onBan: (userId: string) => void
  onAuthorize: (userId: string) => void
  currentUser: any
  isAdmin?: boolean
  isAuthorizedInLocked?: boolean
  unreadMarker?: string // Message ID where unread messages start
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore: () => Promise<void>
  isAuthenticated?: boolean
}

function VerifiedBadge() {
  return (
    <div className="inline-flex items-center justify-center w-4 h-4 ml-0.5 -mt-0.5">
      <svg 
        viewBox="0 0 40 40" 
        className="w-full h-full"
        style={{
          filter: 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.1))'
        }}
      >
        <path
          d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h6.234L14.638 40l5.36-3.094L25.358 40l2.972-5.15h6.234v-6.353L40 25.359 36.906 20 40 14.64l-5.432-3.137V5.15h-6.234L25.358 0l-5.36 3.094"
          fill="#3897F0"
        />
        <path
          d="M17.688 25.063 12 19.312l2.125-2.125 3.563 3.5 8.625-8.625L28.438 14.187z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  )
}

export function MessageThread({
  messages = [],
  onReaction,
  onDelete,
  onEdit,
  onReply,
  onReport,
  onPin,
  onBan,
  onAuthorize,
  currentUser,
  isAdmin = false,
  isAuthorizedInLocked = false,
  unreadMarker,
  isLoading,
  hasMore,
  onLoadMore,
  isAuthenticated = false
}: MessageThreadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<string | null>(null)
  
  // Add intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
  })

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      // Only scroll if it's a new message
      if (lastMessage.id !== lastMessageRef.current) {
        // If it's the current user's message or we're at/near the bottom, scroll
        if (lastMessage.user_id === currentUser?.id || isNearBottom()) {
          scrollToBottom()
        }
        lastMessageRef.current = lastMessage.id
      }
    }
  }, [messages, currentUser?.id])

  // Function to check if we're near the bottom
  const isNearBottom = () => {
    if (scrollRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = scrollRef.current
      return scrollHeight - scrollTop - clientHeight < 100 // within 100px of bottom
    }
    return false
  }

  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  // Load more messages when scrolling up
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      onLoadMore?.()
    }
  }, [inView, hasMore, isLoading, onLoadMore])

  const isAuthorized = (message: Message) => {
    if (!isAuthenticated) return false
    return isAdmin || message.user_id === currentUser?.id || isAuthorizedInLocked
  }

  return (
    <ScrollArea 
      className="h-[calc(100vh-10rem)] w-full" 
      ref={scrollRef}
    >
      <div className="p-4">
        {/* Loading indicator at the top for infinite scroll */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Intersection observer target */}
        <div ref={ref} className="h-4" />

        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => {
              const isUnreadStart = message.id === unreadMarker
              const showAvatar = index === 0 || messages[index - 1]?.user_id !== message.user_id
              const isOwnMessage = isAuthenticated && message.user_id === currentUser?.id
              return (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={cn(
                    "group flex items-start space-x-3 relative hover:bg-muted/50 rounded-lg p-2 -mx-2",
                    isOwnMessage ? "flex-row-reverse space-x-reverse" : "flex-row",
                    isUnreadStart && "border-t border-red-500"
                  )}
                >
                  {showAvatar && (
                    <Avatar className="h-8 w-8 mt-0.5 flex-shrink-0">
                      {message.user_avatar ? (
                        <AvatarImage src={message.user_avatar} alt={message.username} />
                      ) : (
                        <AvatarFallback>
                          {message.username?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}
                  <motion.div
                    className={cn(
                      "flex flex-col space-y-1",
                      isOwnMessage ? "items-end" : "items-start",
                      "max-w-[85%] min-w-[50px]"
                    )}
                  >
                    <div className={cn(
                      "flex items-center gap-2",
                      isOwnMessage && "flex-row-reverse"
                    )}>
                      {showAvatar && (
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm font-medium">
                            {message.username}
                          </span>
                          {message.is_verified && <VerifiedBadge />}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), 'p')}
                          </span>
                          {message.edited_at && (
                            <span className="text-xs text-muted-foreground">(edited)</span>
                          )}
                        </div>
                      )}
                      {isAuthenticated && (
                        <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onReply(message)}
                      >
                        <Reply className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                          {(isOwnMessage || isAdmin) && (
                            <>
                              <DropdownMenuItem onClick={() => onDelete(message.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onEdit(message.id, message.content)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => onPin?.(message.id)}>
                                <Pin className={`h-4 w-4 ${message.is_pinned ? 'text-blue-500' : ''}`} />
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onBan?.(message.user_id)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onAuthorize?.(message.user_id)}>
                                <Shield className="h-4 w-4 mr-2" />
                                {message.user_id && isAuthorizedInLocked 
                                  ? 'Remove Authorization' 
                                  : 'Authorize in Locked Channel'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => onReport(message)}>
                            <Flag className="h-4 w-4 mr-2" />
                            Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                        </>
                      )}
                    </div>
                    <motion.div
                      className={cn(
                        "rounded-lg px-4 py-2 text-sm shadow-sm w-fit",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground rounded-tr-none ml-auto"
                          : "bg-muted rounded-tl-none"
                      )}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <span className="whitespace-pre-wrap break-words">{message.content}</span>
                      {message.image_url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="relative mt-2 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                              <Image
                              src={message.image_url}
                              alt="Uploaded content"
                                width={400}
                                height={300}
                                className="object-contain max-h-[200px]"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx0fHRsdHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/2wBDAR0XFyAeIB4gHh4gIB4dHR0eHh0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHR3/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                              />
                              <div className="absolute inset-0 bg-black/5 transition-opacity opacity-0 hover:opacity-100" />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle className="sr-only">View Image</DialogTitle>
                            </DialogHeader>
                            <div className="relative">
                              <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background/90 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <Image
                                src={message.image_url}
                                alt="Uploaded content"
                                width={1200}
                                height={800}
                                className="w-full h-full object-contain max-h-[80vh]"
                                loading="lazy"
                                quality={100}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </motion.div>
                    {isAuthenticated && (
                    <motion.div 
                      className={cn(
                        "flex flex-wrap items-center gap-1",
                        isOwnMessage ? "flex-row-reverse" : "flex-row"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {message.reactions?.map((reaction) => (
                        <motion.button
                          key={reaction.emoji}
                          onClick={() => isAuthorized(message) && onReaction(message.id, reaction.emoji)}
                          className={cn(
                            "text-sm px-2 py-1 rounded-full transition-colors",
                            reaction.users.includes(currentUser?.id)
                              ? "bg-primary/20 hover:bg-primary/30"
                              : "hover:bg-muted",
                            !isAuthorized(message) && "cursor-not-allowed opacity-50"
                          )}
                          whileHover={isAuthorized(message) ? { scale: 1.1 } : {}}
                          whileTap={isAuthorized(message) ? { scale: 0.95 } : {}}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="ml-1 text-xs">{reaction.users.length}</span>
                        </motion.button>
                      ))}
                      {isAuthorized(message) && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <motion.button
                              className="text-sm text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Smile className="h-4 w-4" />
                            </motion.button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0 border-none shadow-lg" side="top">
                            <Picker
                              data={data}
                              onEmojiSelect={(emoji: any) => onReaction(message.id, emoji.native)}
                              theme="light"
                              set="native"
                              showPreview={false}
                              showSkinTones={false}
                              emojiSize={20}
                              emojiButtonSize={28}
                              maxFrequentRows={0}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </motion.div>
                    )}
                  </motion.div>
                  {isUnreadStart && (
                    <div className="absolute -top-4 left-0 right-0 flex items-center justify-center">
                      <Badge variant="destructive" className="bg-red-500 text-white">
                        New Messages
                      </Badge>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </ScrollArea>
  )
}
