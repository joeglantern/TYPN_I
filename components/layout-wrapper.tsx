'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MainNav } from '@/app/components/main-nav'
import { MobileNav } from '@/app/components/mobile-nav'
import { Footer } from '@/app/components/Footer'
import { ClientBoundary } from '@/components/client-boundary'

interface LayoutWrapperProps {
  children: React.ReactNode
}

function LayoutWrapperContent({ children }: LayoutWrapperProps) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isChatRoute = pathname?.startsWith('/chat')

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true)
    }

    const handleStop = () => {
      setIsLoading(false)
    }

    // Listen for route changes
    window.addEventListener('beforeunload', handleStart)
    window.addEventListener('load', handleStop)

    return () => {
      window.removeEventListener('beforeunload', handleStart)
      window.removeEventListener('load', handleStop)
    }
  }, [])

  // Reset loading state when route changes
  useEffect(() => {
    setIsLoading(false)
  }, [pathname, searchParams])

  // Add viewport meta tag for mobile responsiveness
  useEffect(() => {
    // Check if viewport meta tag exists
    let viewport = document.querySelector('meta[name=viewport]')
    if (!viewport) {
      // Create it if it doesn't exist
      viewport = document.createElement('meta')
      viewport.setAttribute('name', 'viewport')
      document.head.appendChild(viewport)
    }
    // Set the content
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0')
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Loading Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300',
          isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        'flex-1 flex flex-col transition-opacity duration-300',
        isLoading ? 'opacity-50' : 'opacity-100'
      )}>
        {!isChatRoute && (
          <>
            <div className="hidden md:block">
              <MainNav />
            </div>
            <div className="md:hidden">
              <MobileNav />
            </div>
          </>
        )}
        <main className={cn(
          'flex-1',
          isChatRoute ? 'h-screen' : 'container mx-auto px-4 sm:px-6 lg:px-8 py-4'
        )}>
          {children}
        </main>
        {!isChatRoute && <Footer />}
      </div>
    </div>
  )
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <ClientBoundary>
      <LayoutWrapperContent>{children}</LayoutWrapperContent>
    </ClientBoundary>
  )
} 