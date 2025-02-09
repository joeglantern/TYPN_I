'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from '@/lib/supabase'
import { Loader2, Search } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface GalleryImage {
  id: number
  title: string
  description: string
  image_url: string
  category: string
}

interface GallerySelectProps {
  onSelect: (image: GalleryImage) => void
  selectedId?: number
  category?: string
  buttonText?: string
}

export function GallerySelect({
  onSelect,
  selectedId,
  category,
  buttonText = "Select Image"
}: GallerySelectProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      fetchImages()
    }
  }, [open, category])

  const fetchImages = async () => {
    try {
      let query = supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = images.filter(image =>
    image.title.toLowerCase().includes(search.toLowerCase()) ||
    image.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (image: GalleryImage) => {
    onSelect(image)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Image from Gallery</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search images..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 hover:border-primary transition-colors",
                  selectedId === image.id ? "border-primary" : "border-transparent"
                )}
                onClick={() => handleSelect(image)}
              >
                <Image
                  src={image.image_url}
                  alt={image.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity p-4">
                  <h3 className="text-white font-semibold">{image.title}</h3>
                  {image.description && (
                    <p className="text-white/80 text-sm mt-1 line-clamp-2">
                      {image.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 