'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MainNav } from '@/app/components/main-nav'
import { MobileNav } from '@/app/components/mobile-nav'
import { Footer } from '@/app/components/Footer'
import dynamic from 'next/dynamic'

// Dynamically import components that are not needed immediately
const DynamicToaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), {
  ssr: false,
  loading: () => null
})

const DynamicMainNav = dynamic(() => import('@/app/components/main-nav').then(mod => mod.MainNav), {
  ssr: true,
  loading: () => <div className="h-16 bg-background/95 backdrop-blur" />
})

const DynamicMobileNav = dynamic(() => import('@/app/components/mobile-nav').then(mod => mod.MobileNav), {
  ssr: true,
  loading: () => <div className="h-14 bg-background/95 backdrop-blur md:hidden" />
})

const DynamicFooter = dynamic(() => import('@/app/components/Footer').then(mod => mod.Footer), {
  ssr: true,
  loading: () => <div className="h-16 bg-background" />
})

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isChatRoute = pathname?.startsWith('/chat')

  // Show initial loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  // Handle route changes
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  // Prefetch routes in background
  useEffect(() => {
    const prefetchRoutes = async () => {
      const routes = ['/', '/programs', '/events', '/blog', '/chat']
      for (const route of routes) {
        try {
          const link = document.createElement('link')
          link.rel = 'prefetch'
          link.href = route
          document.head.appendChild(link)
        } catch (error) {
          console.error(`Failed to prefetch ${route}:`, error)
        }
      }
    }
    
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => prefetchRoutes())
    } else {
      setTimeout(prefetchRoutes, 0)
    }
  }, [])

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your experience...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={cn('flex-1 flex flex-col', isLoading && 'opacity-50 pointer-events-none')}>
        {!isChatRoute && (
          <>
            <div className="hidden md:block">
              <DynamicMainNav />
            </div>
            <div className="md:hidden">
              <DynamicMobileNav />
            </div>
          </>
        )}
        <main className={cn(
          'flex-1',
          isChatRoute ? 'h-screen' : 'container mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-20'
        )}>
          {children}
        </main>
        {!isChatRoute && <DynamicFooter />}
      </div>
      <DynamicToaster />
    </div>
  )
} 
