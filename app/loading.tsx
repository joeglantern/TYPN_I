'use client'

import Image from 'next/image'

export default function Loading() {
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
          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-20 blur-2xl animate-pulse" />
        </div>
        <div className="mt-4">
          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden mx-auto">
            <div className="h-full w-1/2 bg-primary animate-[shimmer_1s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  )
} 