'use client'

import { useEffect, useState } from 'react'

export function LoadingBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 0
        }
        const diff = Math.random() * 10
        return Math.min(oldProgress + diff, 100)
      })
    }, 500)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <div 
        className="h-1 bg-primary transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
} 