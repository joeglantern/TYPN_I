'use client'

import { createContext, useContext, useEffect, useState } from "react"
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav } from '@/components/mobile-nav'
import { Home, Info, Calendar, BookOpen, Heart, Phone, Users, LogIn, UserPlus, User, GraduationCap, MessagesSquare, Loader2 } from 'lucide-react'
import Footer from '@/components/Footer'
import { NotificationComponent } from './components/Notification'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const publicNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: Info },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/volunteer", label: "Volunteer", icon: Heart },
  { href: "/programs", label: "Programs", icon: GraduationCap },
  { href: "/contact", label: "Contact", icon: Phone },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
]

const authNavLinks = [
  { href: "/auth/login", label: "Login", icon: LogIn },
  { href: "/auth/signup", label: "Sign Up", icon: UserPlus },
]

// Create a context for global loading state
export const LoadingContext = createContext({
  isLoading: false,
  setIsLoading: (loading: boolean) => {},
})

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Handle initial mount and auth check
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return;
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (!mounted) return;
          
          setIsAuthenticated(true)
          setUserRole(profile?.role || 'user')
        } else {
          if (pathname === '/profile' || pathname.startsWith('/admin')) {
            router.replace('/auth/login')
            return;
          }
          setIsAuthenticated(false)
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setIsAuthenticated(false)
        setUserRole(null)
      } finally {
        if (mounted) {
          setMounted(true)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()
    
    return () => {
      mounted = false
    }
  }, [pathname])

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
      } else if (event === 'SIGNED_IN') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle route changes
  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timeout)
  }, [pathname])

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return [...publicNavLinks, ...authNavLinks]
    }

    const authenticatedLinks = [
      ...publicNavLinks,
      { href: "/profile", label: "Profile", icon: User },
    ]

    if (userRole === 'admin') {
      authenticatedLinks.push({ href: "/admin", label: "Admin", icon: Users })
    }

    return authenticatedLinks
  }

  const navLinks = getNavLinks()

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20">
            <Image
              src="/logo.png"
              alt="TYPNI Logo"
              width={80}
              height={80}
              className="animate-bounce-slow"
              priority
            />
          </div>
          <div className="h-2 w-24 bg-muted overflow-hidden rounded-full">
            <div className="h-full w-1/2 bg-primary animate-[shimmer_1s_infinite]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
      <div className="min-h-screen flex flex-col">
        {pathname !== '/chat' && (
          <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2" prefetch={true}>
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="TYPNI - Transform Youth Power Network International"
                    width={40}
                    height={40}
                    className="animate-float"
                    priority
                  />
                </div>
                <span className="font-bold text-xl">TYPNI</span>
              </Link>
              <nav className="hidden md:flex items-center space-x-4">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        pathname === link.href
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  )
                })}
                <ThemeToggle />
              </nav>
              <div className="md:hidden">
                <MobileNav />
              </div>
            </div>
          </header>
        )}
        <main className={cn(
          "flex-1 relative overflow-hidden",
          pathname === '/chat' && "h-screen"
        )}>
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
            <div className="absolute top-1/3 -right-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-10 blur-[100px]" />
          {children}
        </main>
        {pathname !== '/chat' && (
          <Footer />
        )}
        <NotificationComponent />
      </div>
    </LoadingContext.Provider>
  )
} 