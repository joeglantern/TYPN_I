'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Home, Calendar, BookOpen, HeartHandshake, Info, Briefcase, Mail, Heart, Users, LogIn, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/blog', label: 'Blog', icon: BookOpen },
  { href: '/volunteer', label: 'Volunteer', icon: HeartHandshake },
  { href: '/about', label: 'About', icon: Info },
  { href: '/programs', label: 'Programs', icon: Briefcase },
  { href: '/contact', label: 'Contact', icon: Mail },
  { href: '/donate', label: 'Donate', icon: Heart },
  { href: '/partners', label: 'Partners', icon: Users },
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useState(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-black/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="TYPNI Logo"
                width={48}
                height={48}
                className="animate-float"
                priority
              />
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-20 blur-2xl animate-pulse" />
            </div>
            <span className="text-2xl font-bold text-white">TYPNI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-white/80 hover:text-white transition-colors flex items-center space-x-1"
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-white/80 hover:text-white"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button asChild variant="outline" className="text-white border-white/20 hover:bg-white/10">
              <Link href="/profile">Profile</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-2 md:hidden">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-white/80 hover:text-white"
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white/80 hover:text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-white/80 hover:text-white transition-colors flex items-center space-x-2 px-2 py-1"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
              <Button asChild variant="outline" className="text-white border-white/20 hover:bg-white/10">
                <Link href="/profile">Profile</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
