'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface CarouselProps {
  section: 'hero' | 'events' | 'programs'
  aspectRatio?: 'square' | 'video' | 'wide'
  className?: string
}

export function Carousel({ section, aspectRatio = 'video', className }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [items, setItems] = useState<Array<{
    id: string
    title: string
    description: string | null
    image_url: string
  }>>([])

  useEffect(() => {
    fetchCarouselItems()
  }, [section])

  const fetchCarouselItems = async () => {
    try {
      const { data, error } = await supabase
        .from('carousels')
        .select('*')
        .eq('section', section)
        .eq('active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      if (data) {
        setItems(data.map(item => ({
          id: item.id.toString(),
          title: item.title,
          description: item.description,
          image_url: item.image_url
        })))
      }
    } catch (error) {
      console.error('Error fetching carousel items:', error)
    }
  }

  const next = () => {
    setCurrentIndex((currentIndex + 1) % items.length)
  }

  const previous = () => {
    setCurrentIndex((currentIndex - 1 + items.length) % items.length)
  }

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [currentIndex, items.length])

  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn('relative group', className)}>
      <div className={cn(
        'relative overflow-hidden rounded-lg',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === 'wide' && 'aspect-[21/9]'
      )}>
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              'absolute inset-0 w-full h-full transition-opacity duration-300',
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            )}
          >
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-white/80 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={previous}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={next}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {items.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                )}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
} 