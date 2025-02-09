'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, ZoomIn, ZoomOut } from 'lucide-react'

interface ReadingSettingsProps {
  onFontSizeChange: (size: number) => void
}

export function ReadingSettings({ onFontSizeChange }: ReadingSettingsProps) {
  const [fontSize, setFontSize] = useState(100)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const adjustFontSize = (delta: number) => {
    const newSize = Math.min(Math.max(fontSize + delta, 80), 150)
    setFontSize(newSize)
    onFontSizeChange(newSize)
  }

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="fixed right-4 top-24 bg-background border rounded-lg shadow-lg p-4 space-y-4 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={() => adjustFontSize(-10)}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          aria-label="Decrease font size"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium min-w-[3ch] text-center">
          {fontSize}%
        </span>
        <button
          onClick={() => adjustFontSize(10)}
          className="p-2 hover:bg-muted rounded-md transition-colors"
          aria-label="Increase font size"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      <div className="border-t pt-4">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 text-sm w-full p-2 hover:bg-muted rounded-md transition-colors"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
} 