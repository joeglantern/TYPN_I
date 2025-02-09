'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  BarChart3, 
  Users, 
  Settings, 
  MessageSquare,
  Flag,
  Image,
  FileText,
  Home,
  Calendar,
  Ban,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Banned Users', href: '/admin/banned-users', icon: Ban },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Blogs', href: '/admin/blogs', icon: FileText },
  { name: 'Gallery', href: '/admin/gallery', icon: Image },
  { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
  { name: 'Content', href: '/admin/content', icon: FileText },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/auth/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (error || profile?.role !== 'admin') {
        toast.error('You do not have permission to access this area')
        router.replace('/')
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.replace('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 bg-muted overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link href="/">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
          <div className="mt-5 flex-grow flex flex-col">
            <ScrollArea className="flex-1">
              <nav className="flex-1 px-2 pb-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted-foreground/10',
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive
                            ? 'text-primary-foreground'
                            : 'text-muted-foreground',
                          'mr-3 flex-shrink-0 h-5 w-5'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
} 