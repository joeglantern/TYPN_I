'use client'

import { Suspense, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ClientBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ClientBoundary({ 
  children, 
  fallback = (
    <div className="flex h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}: ClientBoundaryProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
} 