'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Globe, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function HeroSection() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push('/programs')
    } else {
      router.push('/auth/signup')
    }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 text-white">
      <div className="container mx-auto px-4 text-center">
        <h1 className="text-6xl font-bold mb-6 animate-fade-in-up">
          <span className="block text-7xl bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-4">
            Niaje!
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
            Connect. Empower. Change.
          </span>
        </h1>
        
        <p className="text-xl text-white/90 mb-8 animate-fade-in-up animation-delay-200 max-w-2xl mx-auto">
          Empowering youth through global connections and opportunities. Join our mission to create positive change in communities worldwide.
        </p>
        
        <div className="flex items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="group bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-opacity"
          >
            {loading ? 'Loading...' : isAuthenticated ? 'Explore Programs' : 'Get Started'}
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="group border-white/20 hover:bg-white/10"
          >
            <Link href="/about">
              Learn More
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Globe, title: 'Global Network', description: 'Connect with peers worldwide' },
            { icon: Users, title: 'Diverse Community', description: 'Learn from various cultures' },
            { icon: Zap, title: 'Impactful Projects', description: 'Make a real difference' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center animate-fade-in-up"
              style={{ animationDelay: `${(index + 3) * 100}ms` }}
            >
              <div className="bg-white text-purple-600 rounded-full p-3 mb-4">
                <item.icon size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-white/80">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
