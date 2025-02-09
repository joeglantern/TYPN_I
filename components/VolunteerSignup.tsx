'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'

export default function VolunteerSignup() {
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
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 animate-fade-in-up">
      <h2 className="text-2xl font-bold mb-6">Sign Up to Volunteer</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter your phone number"
            required
          />
        </div>
        <div>
          <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
            Interests & Skills
          </label>
          <Textarea
            id="interests"
            placeholder="Tell us about your interests and skills"
            className="h-32"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700"
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
  )
} 