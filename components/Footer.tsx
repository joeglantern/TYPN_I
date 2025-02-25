'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

type IconProps = React.SVGProps<SVGSVGElement>

const quickLinks = [
  { href: '/about', label: 'About Us' },
  { href: '/programs', label: 'Programs' },
  { href: '/events', label: 'Events' },
  { href: '/blog', label: 'Blog' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/volunteer', label: 'Volunteer' },
  { href: '/contact', label: 'Contact' },
]

const navigation = {
  main: [
    { name: 'Home', href: '/' },
    { name: 'Programs', href: '/programs' },
    { name: 'Blog', href: '/blog' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  social: [
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/typn_i/',
      icon: (props: IconProps) => (
        <svg
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
          {...props}
        >
          <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
    },
    {
      name: 'TikTok',
      href: 'https://www.tiktok.com/@typni_',
      icon: (props: IconProps) => (
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          {...props}
        >
          <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 015.2 5.82s-.51.5 0 0 1.46-1.34 0 0A4.278 4.278 0 0116.6 5.82s-.51.5 0 0M8 14.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0zM15 4h1a1 1 0 011 1v1h-1V4z"/>
          <path d="M19.44 6.34c-.27-.81-1-1.39-1.88-1.39h-3.99v10.35c0 2.35-1.97 4.27-4.39 4.27-2.42 0-4.39-1.92-4.39-4.27s1.97-4.27 4.39-4.27c.28 0 .55.03.81.08v-3.91c-.43-.02-.87-.04-1.33-.04-7.39 0-13.39 6-13.39 13.39s6 13.39 13.39 13.39 13.39-6 13.39-13.39c0-2.12-.5-4.07-1.39-5.84z"/>
        </svg>
      ),
    },
  ],
}

const Footer = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          {navigation.main.map((item) => (
            <div key={item.name} className="pb-6">
              <Link href={item.href} className="text-sm leading-6 text-muted-foreground hover:text-foreground">
                {item.name}
              </Link>
            </div>
          ))}
        </nav>
        <div className="mt-10 flex justify-center space-x-10">
          {navigation.social.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-xs leading-5 text-muted-foreground">
          &copy; {new Date().getFullYear()} TYPNI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer 