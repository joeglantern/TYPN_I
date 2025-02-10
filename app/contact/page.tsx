'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send, MapPin, Phone, Mail } from 'lucide-react'
import { ClientBoundary } from '@/components/client-boundary'

function ContactContent() {
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
      <h1 className="text-4xl font-bold mb-8 text-center animate-fade-in-up">Contact Us</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="animate-fade-in-up animation-delay-200">
          <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <Input type="text" id="name" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" id="email" required />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
              <Textarea id="message" required className="h-32" />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>
        <div className="animate-fade-in-up animation-delay-400">
          <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <MapPin className="mr-4 text-primary" size={24} />
              <div>
                <h3 className="font-semibold">Location</h3>
                <p>Nairobi, Kenya</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="mr-4 text-primary" size={24} />
              <div>
                <h3 className="font-semibold">Phone</h3>
                <p>+254758009278</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="mr-4 text-primary" size={24} />
              <div>
                <h3 className="font-semibold">Email</h3>
                <p>Niaje@typni.org</p>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">Office Hours</h3>
            <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
            <p>Saturday - Sunday: Closed</p>
          </div>
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">Connect With Us</h3>
            <p className="text-muted-foreground">
              Follow us on social media to stay updated with our latest events and initiatives.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <ClientBoundary>
      <ContactContent />
    </ClientBoundary>
  )
}
