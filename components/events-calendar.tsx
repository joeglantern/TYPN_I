'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import Image from 'next/image'

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

export function EventsCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true })
          .gte('date', new Date().toISOString())
          .limit(3)

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
      <div className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">Upcoming Events</h2>
          <Button asChild variant="outline" className="group">
            <Link href="/events" className="flex items-center gap-2">
              View All
              <Calendar className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((_, index) => (
            <div
              key={index}
              className="bg-card/50 backdrop-blur-sm p-4 rounded-xl border shadow-sm animate-pulse"
            >
              <div className="h-40 bg-muted rounded-lg mb-4" />
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
                <div className="h-4 w-1/3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500">Upcoming Events</h2>
        <Button asChild variant="outline" className="group">
          <Link href="/events" className="flex items-center gap-2">
            View All
            <Calendar className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No upcoming events at the moment. Check back later!
          </div>
        ) : (
          events.map((event, index) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group relative overflow-hidden bg-card/50 backdrop-blur-sm rounded-xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative p-4 h-full flex flex-col">
              {(event.image_urls?.length > 0 || event.image_url) && (
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-4 group-hover:scale-[1.02] transition-transform duration-500">
                  <Image
                    src={event.image_urls?.[0] || event.image_url}
                    alt={event.title}
                    fill
                      className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                    priority={index === 0}
                  />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              )}
                
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                  {event.title}
                </h3>
                
                <div className="space-y-2 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <time dateTime={event.date} className="group-hover:text-primary transition-colors">
                    {format(new Date(event.date), 'PPP')}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="group-hover:text-primary transition-colors">{event.location}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                {event.content.replace(/<[^>]*>/g, '')}
              </p>
                
                <div className="flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform duration-300">
                  Learn More
                  <Clock className="w-4 h-4 ml-1 animate-pulse" />
                </div>
              </div>
                </Link>
          ))
        )}
      </div>
    </div>
  )
} 