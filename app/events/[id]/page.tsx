'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { MapPin, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  title: string
  content: string
  date: string
  location: string
  image_url: string
  image_urls: string[]
  created_at: string
  updated_at: string
}

export default function EventPage() {
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setEvent(data)
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <p className="text-muted-foreground">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const hasMultipleImages = event.image_urls?.length > 1
  const images = event.image_urls || (event.image_url ? [event.image_url] : [])

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const previousImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <article className="container mx-auto py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">{event.title}</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-8 text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <time dateTime={event.date}>
              {format(new Date(event.date), 'PPP')}
            </time>
          </div>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            <span>{event.location}</span>
          </div>
        </div>

        {images.length > 0 && (
          <div className="relative aspect-video mb-8 rounded-lg overflow-hidden group">
            <Image
              src={images[currentImageIndex]}
              alt={`${event.title} - Image ${currentImageIndex + 1}`}
              fill
              className="object-cover"
              priority
            />
            {hasMultipleImages && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: event.content }}
        />
      </div>
    </article>
  )
} 