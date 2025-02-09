'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
          .gte('date', new Date().toISOString()) // Only future events

        if (error) throw error
        setEvents(data || [])
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No upcoming events at the moment. Check back later!
          </p>
        ) : (
          events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="group bg-background rounded-lg border shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video relative">
                  <Image
                    src={event.image_urls?.[0] || event.image_url || '/placeholder-image.jpg'}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    priority={false}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      <time dateTime={event.date}>
                        {format(new Date(event.date), 'PPP')}
                      </time>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground line-clamp-3">
                    {event.content.replace(/<[^>]*>/g, '')}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
