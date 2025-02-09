'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Send } from 'lucide-react'

const VolunteerSignup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    interests: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Volunteer data:', formData)
    toast({
      title: "Thank you for volunteering!",
      description: "We'll be in touch soon with opportunities matching your interests.",
    })
    setFormData({ name: '', email: '', interests: '' })
    setIsSubmitting(false)
  }

  return (
    <section className="py-12 md:py-20 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 animate-fade-in-up">Volunteer with Us</h2>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md animate-fade-in-up">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700">Interests</label>
              <Textarea
                id="interests"
                name="interests"
                value={formData.interests}
                onChange={handleChange}
                required
                className="mt-1"
                placeholder="Tell us about your interests and skills..."
                disabled={isSubmitting}
              />
            </div>
          </div>
          <Button type="submit" className="w-full mt-6 bg-purple-600 hover:bg-purple-700" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Sign Up to Volunteer
              </>
            )}
          </Button>
        </form>
      </div>
    </section>
  )
}

export default VolunteerSignup
