'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, DollarSign, Heart } from 'lucide-react'
import { ClientBoundary } from '@/components/client-boundary'

function DonateContent() {
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    // Here you would typically handle the donation process
    console.log('Donation submitted:', amount)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center animate-fade-in-up">Support Our Cause</h1>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 animate-fade-in-up animation-delay-200">
        <h2 className="text-2xl font-bold mb-4 text-center">Make a Donation</h2>
        <p className="text-gray-600 mb-6 text-center">Your contribution helps us empower youth around the world.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Donation Amount ($)</label>
            <Input 
              type="number" 
              id="amount" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              required 
              min="1" 
              step="1"
              className="text-2xl"
            />
          </div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-lg" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-6 w-6" />
                Donate Now
              </>
            )}
          </Button>
        </form>
        <div className="mt-8 text-center">
          <h3 className="text-xl font-bold mb-2">Why Donate?</h3>
          <p className="text-gray-600 mb-4">Your donation directly supports our programs and initiatives, helping us:</p>
          <ul className="text-left list-disc list-inside space-y-2 mb-4">
            <li>Provide educational resources to underprivileged youth</li>
            <li>Organize leadership workshops and conferences</li>
            <li>Support youth-led community projects</li>
            <li>Facilitate cultural exchange programs</li>
          </ul>
          <p className="flex items-center justify-center text-purple-600 font-semibold">
            <Heart className="mr-2" /> Thank you for your support!
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DonatePage() {
  return (
    <ClientBoundary>
      <DonateContent />
    </ClientBoundary>
  )
}
