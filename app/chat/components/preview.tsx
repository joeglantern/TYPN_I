'use client'

import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface PreviewProps {
  previewTimeLeft: number
}

export function Preview({ previewTimeLeft }: PreviewProps) {
  const router = useRouter()

  const sampleMessages = [
    {
      id: 1,
      username: 'Alice',
      content: 'Welcome to TYPNI Chat! 👋',
      time: '2 minutes ago'
    },
    {
      id: 2,
      username: 'Bob',
      content: 'This is a great place to connect with volunteers!',
      time: '1 minute ago'
    },
    {
      id: 3,
      username: 'Charlie',
      content: 'Join us to make a difference in communities worldwide 🌍',
      time: 'Just now'
    }
  ]

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container mx-auto relative">
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-full animate-pulse">
          Preview: {previewTimeLeft}s
        </div>
        <div className="opacity-90">
          <div className="flex h-screen bg-background overflow-hidden">
            {/* Chat UI */}
            <div className="w-full flex flex-col">
              <div className="h-14 border-b flex items-center px-4">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">TYPNI Chat</h1>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {sampleMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 animate-fade-in-up">
                      <Avatar>
                        <AvatarFallback>{msg.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{msg.username}</span>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm mt-1">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-background/95 backdrop-blur">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-md px-3 py-2 text-muted-foreground">
                    Sign in to join the conversation...
                  </div>
                  <Button 
                    onClick={() => router.push('/auth/login')} 
                    className="bg-[#5865F2] hover:bg-[#4752C4]"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}