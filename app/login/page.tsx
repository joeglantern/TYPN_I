'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    // Here you would typically handle the login logic
    console.log('Login submitted')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-4xl font-bold mb-8 text-center animate-fade-in-up">Login to TYPNI</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8 animate-fade-in-up animation-delay-200">
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <Input type="email" id="email" required className="w-full" />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Input type="password" id="password" required className="w-full" />
        </div>
        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </>
          )}
        </Button>
      </form>
    </div>
  )
}
