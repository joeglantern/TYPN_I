'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Menu, Moon, Sun } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from 'next-themes'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/blog', label: 'Blog' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/programs', label: 'Programs' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/announcements', label: 'Announcements' },
  { href: '/contact', label: 'Contact' }
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        setIsAdmin(profile?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="TYPNI Logo"
                width={48}
                height={48}
                className="h-12 w-auto animate-float"
                priority
                unoptimized
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-20 blur-xl animate-pulse" />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && !loading && (
              <Button variant="outline" asChild>
                <Link href="/admin">Admin Portal</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/donate">Donate</Link>
            </Button>
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="ml-2"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="space-y-4 px-4 pb-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-sm font-medium transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && !loading && (
                <Button variant="outline" asChild className="w-full">
                  <Link href="/admin">Admin Portal</Link>
                </Button>
              )}
              <Button asChild className="w-full">
                <Link href="/donate">Donate</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 