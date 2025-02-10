'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HeartHandshake, Globe, Users, Loader2, Send, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ClientBoundary } from '@/components/client-boundary'

function VolunteerContent() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    // Here you would typically handle the form submission
    console.log('Form submitted')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative mb-16 text-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-4 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-yellow-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/3 -right-4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
        </div>
        <div className="relative w-[120px] h-[120px] mx-auto mb-6">
          <Image
            src="/logo.png"
            alt="TYPNI Logo"
            fill
            className="animate-float object-contain"
            priority
            style={{ objectFit: 'contain' }}
          />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-fade-in-up">
          Volunteer with TYPNI
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
          Join our global community of changemakers and make a lasting impact in communities worldwide
        </p>
        <div className="flex items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
          <Button asChild size="lg" className="group bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-opacity">
            <Link href="#volunteer-form">
              Get Started
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="group">
            <Link href="/about">
              Learn More
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Benefits Grid */}
      <div className="grid gap-8 md:grid-cols-3 mb-12">
        {[
          {
            title: 'Make a Difference',
            description: 'Your skills can help change lives around the world.',
            color: 'bg-pink-500/10 text-pink-500',
            icon: <HeartHandshake className="w-8 h-8" />,
          },
          {
            title: 'Global Opportunities',
            description: 'Volunteer locally or internationally with our partners.',
            color: 'bg-purple-500/10 text-purple-500',
            icon: <Globe className="w-8 h-8" />,
          },
          {
            title: 'Build Your Network',
            description: 'Connect with like-minded individuals from diverse backgrounds.',
            color: 'bg-indigo-500/10 text-indigo-500',
            icon: <Users className="w-8 h-8" />,
          },
        ].map((benefit, index) => (
          <div
            key={benefit.title}
            className="bg-card p-6 rounded-lg border shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-16 h-16 rounded-full ${benefit.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
              {benefit.icon}
            </div>
            <h2 className="text-xl font-bold mb-2 text-center">{benefit.title}</h2>
            <p className="text-muted-foreground text-center">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* Volunteer Form */}
      <div id="volunteer-form" className="max-w-2xl mx-auto bg-card p-8 rounded-lg border shadow-lg animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">Sign Up to Volunteer</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              required
              className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              required
              className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              required
              className="transition-all duration-300 focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="interests" className="block text-sm font-medium mb-1">
              Interests & Skills
            </label>
            <Textarea
              id="interests"
              placeholder="Tell us about your interests and skills"
              className="h-32 transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-opacity"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Application
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function VolunteerPage() {
  return (
    <ClientBoundary>
      <VolunteerContent />
    </ClientBoundary>
  )
}
