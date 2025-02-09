'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  image_url?: string
  created_at: string
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTestimonials(data || [])
    } catch (error) {
      console.error('Error fetching testimonials:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">What People Say About Us</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Read testimonials from our community members, volunteers, and partners about their experiences with TYPNI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-4">
                  {testimonial.image_url ? (
                    <AvatarImage src={testimonial.image_url} alt={testimonial.name} />
                  ) : (
                    <AvatarFallback>{testimonial.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <blockquote className="text-lg mb-4">{testimonial.content}</blockquote>
                <footer>
                  <cite className="not-italic font-semibold">{testimonial.name}</cite>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </footer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 