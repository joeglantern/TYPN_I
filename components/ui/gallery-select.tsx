'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface GalleryImage {
  id: number
  title: string
  description: string
  image_url: string
  category: string
}

interface GallerySelectProps {
  onSelect: (imageId: number, imageUrl: string) => void
  selectedImageId?: number
  buttonText?: string
  className?: string
}

export function GallerySelect({ onSelect, selectedImageId, buttonText = "Select Image", className }: GallerySelectProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      fetchImages()
    }
  }, [open])

  const fetchImages = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (image: GalleryImage) => {
    onSelect(image.id, image.image_url)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("w-full", className)}>
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select an Image</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {loading ? (
            <div className="col-span-3 flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            images.map((image) => (
              <div
                key={image.id}
                className={cn(
                  "relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2",
                  selectedImageId === image.id ? "border-primary" : "border-transparent",
                  "hover:border-primary/50 transition-colors"
                )}
                onClick={() => handleImageSelect(image)}
              >
                <Image
                  src={image.image_url}
                  alt={image.title || "Gallery image"}
                  fill
                  className="object-cover"
                />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 