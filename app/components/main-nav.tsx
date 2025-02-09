'use client'

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { supabase } from "@/lib/supabase"
import { Home, Book, Calendar, Edit, Image as ImageIcon, MessageCircle, Info, Mail, User, Settings } from 'lucide-react'
import { useEffect, useState } from "react"

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/programs', label: 'Programs', icon: Book },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/blog', label: 'Blog', icon: Edit },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/polls', label: 'Polls', icon: Home },
]

export function MainNav() {
  const pathname = usePathname()
  const [session, setSession] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="TYPNI Logo"
              width={32}
              height={32}
              className="animate-float"
              priority
            />
            <span className="hidden font-bold sm:inline-block">
              TYPNI
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground/80 flex items-center gap-2",
                  pathname === link.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Add search functionality here if needed */}
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <>
                {isAdmin && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">Log In</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
} 
