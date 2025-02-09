'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for smoother transition
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative w-[120px] h-[120px] inline-block">
            <Image
              src="/logo.png"
              alt="TYPNI Logo"
              width={120}
              height={120}
              className="animate-float"
              priority
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#454FBF] rounded-full opacity-20 blur-2xl animate-pulse" />
          </div>
          <div className="mt-4">
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden mx-auto">
              <div className="h-full w-1/2 bg-[#5865F2] animate-[shimmer_1s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      {children}
    </div>
  )
} 