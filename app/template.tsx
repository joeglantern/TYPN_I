'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Template({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000) // Show loading screen for 2 seconds
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-50">
        <div className="text-center">
          <div className="relative w-[160px] h-[160px] inline-block">
            <Image
              src="/logo.png"
              alt="TYPNI Logo"
              width={160}
              height={160}
              className="animate-float"
              priority
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-20 blur-2xl animate-pulse" />
          </div>
          <div className="mt-8">
            <div className="h-2 w-32 bg-muted rounded-full overflow-hidden mx-auto">
              <div className="h-full w-1/2 bg-primary animate-[shimmer_1s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return children
} 