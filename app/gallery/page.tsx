'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface GalleryItem {
  id: string
  title: string
  description: string
  url: string
  is_featured: boolean
  created_at: string
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      console.log('Fetching public gallery images...')
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching public gallery:', error)
        throw error
      }

      console.log('Fetched public gallery images:', data)
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Gallery</h1>

      {/* Featured Images */}
      {images.some(img => img.is_featured) && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Featured</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {images
              .filter(img => img.is_featured)
              .map((image) => (
                <div
                  key={image.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={image.url}
                      alt={image.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2">
                    <h3 className="font-semibold">{image.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {image.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* All Images */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images
          .filter(img => !img.is_featured)
          .map((image) => (
            <div
              key={image.id}
              className="group cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </div>
          ))}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>{selectedImage?.title || 'Image Preview'}</DialogTitle>
          {selectedImage && (
            <div>
              <div className="relative aspect-video">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-semibold">{selectedImage.title}</h2>
                <p className="text-muted-foreground mt-2">
                  {selectedImage.description}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 