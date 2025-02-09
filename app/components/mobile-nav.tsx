'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "./theme-toggle"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { Home, Book, Calendar, Edit, Image as ImageIcon, MessageCircle, Info, Mail, User, Settings } from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface MobileNavProps {
  links?: Array<{
    href: string
    label: string
    icon: LucideIcon
  }>
  currentPath?: string
}

const defaultLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/programs', label: 'Programs', icon: Book },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/blog', label: 'Blog', icon: Edit },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
]

export function MobileNav({ links = defaultLinks, currentPath = '/' }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)
  const [session, setSession] = React.useState<any>(null)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check auth status
  React.useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)

      if (currentSession) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single()

        setIsAdmin(profile?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking auth:', error)
    }
  }

  // Prefetch all links when component mounts
  React.useEffect(() => {
    if (links && links.length > 0) {
      links.forEach((link) => {
        router.prefetch(link.href)
      })
    }
  }, [router, links])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex h-14 items-center justify-between px-4 border-b md:hidden">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="TYPNI Logo"
            width={32}
            height={32}
            className="animate-float"
            priority
          />
          <span className="font-bold">TYPNI</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
        </div>
      </div>
      <SheetContent side="right" className="w-[300px] sm:w-[380px] pr-0">
        <SheetHeader className="px-6 border-b pb-4 mb-4">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="TYPNI Logo"
              width={40}
              height={40}
              className="animate-float"
              priority
            />
            <SheetTitle>TYPNI</SheetTitle>
          </Link>
        </SheetHeader>
        <div className="flex flex-col h-[calc(100vh-120px)]">
          <nav className="flex-1 px-2 overflow-y-auto">
            <div className="space-y-1">
              {links && links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-base rounded-md transition-colors",
                    pathname === link.href 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent"
                  )}
                >
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              ))}
              {session && (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 text-base rounded-md transition-colors",
                        pathname === '/admin'
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">Admin Dashboard</span>
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-base rounded-md transition-colors",
                      pathname === '/profile'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                  >
                    <User className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Profile</span>
                  </Link>
                </>
              )}
            </div>
          </nav>
          {!session && (
            <div className="border-t mt-auto p-4 space-y-2">
              <Button className="w-full" variant="outline" asChild>
                <Link href="/auth/login" onClick={() => setOpen(false)}>
                  Log In
                </Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/auth/register" onClick={() => setOpen(false)}>
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
} 