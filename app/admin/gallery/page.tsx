'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Pencil, Trash, Star, Trash2, Upload } from "lucide-react"
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface GalleryItem {
  id: string
  title: string
  description: string
  url: string
  is_featured: boolean
  created_at: string
}

export default function AdminGalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
    fetchImages()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/')
        toast.error('Only administrators can access this page')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/')
    }
  }

  const fetchImages = async () => {
    try {
      console.log('Fetching images...')
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching images:', error)
        throw error
      }
      
      console.log('Fetched images:', data)
      setImages(data || [])
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
    const files = fileInput.files

    if (!files?.length || !title.trim()) {
      toast.error('Please provide both title and at least one image')
      return
    }

    try {
      setUploading(true)
      console.log('Starting upload process...')

      // Create storage bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets()
      console.log('Available buckets:', buckets)

      if (!buckets?.find(b => b.name === 'gallery')) {
        console.log('Creating gallery bucket...')
        await supabase.storage.createBucket('gallery', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        })
      }

      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) throw new Error('No user session found')

      console.log('User ID:', session.user.id)

      // Upload all images
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // Upload image to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        console.log('Uploading file:', fileName)
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('gallery')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        console.log('Upload successful:', uploadData)

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(fileName)

        console.log('Public URL:', publicUrl)

        // Save to database
        const { error: dbError, data: insertedData } = await supabase
          .from('gallery')
          .insert([{
            title: `${title.trim()}${files.length > 1 ? ` (${i + 1})` : ''}`,
            description: description.trim(),
            url: publicUrl,
            uploaded_by: session.user.id
          }])
          .select()
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          throw dbError
        }

        console.log('Inserted data:', insertedData)
      }

      toast.success('Images uploaded successfully')
      setTitle('')
      setDescription('')
      form.reset()
      await fetchImages()
    } catch (error: any) {
      console.error('Error uploading:', error.message || error)
      toast.error(error.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      // Delete from storage
      const fileName = imageUrl.split('/').pop()
      if (fileName) {
        await supabase.storage
          .from('gallery')
          .remove([fileName])
      }

      // Delete from database
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Image deleted successfully')
      fetchImages()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete image')
    }
  }

  const toggleFeatured = async (id: string) => {
    try {
      const image = images.find(img => img.id === id)
      if (!image) return

      const { error } = await supabase
        .from('gallery')
        .update({ is_featured: !image.is_featured })
        .eq('id', id)

      if (error) throw error

      await fetchImages()
      toast.success(`Image ${image.is_featured ? 'removed from' : 'added to'} carousel`)
    } catch (error: any) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update image status')
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
      <h1 className="text-2xl font-bold mb-6">Gallery Management</h1>

      {/* Upload Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Upload className="h-4 w-4 mr-2" />
            Upload New Images
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
            <DialogDescription>
              Add new images to the gallery. Please provide a title and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter image title"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                For multiple images, numbers will be appended automatically
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter image description"
              />
            </div>
            <div>
              <Label htmlFor="image">Images</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                multiple
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                You can select multiple images at once
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Images'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div
            key={image.id}
            className="border rounded-lg overflow-hidden bg-card"
          >
            <div className="relative aspect-video">
              <Image
                src={image.url}
                alt={image.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{image.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {image.description}
              </p>
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFeatured(image.id)}
                  title={image.is_featured ? "Remove from carousel" : "Add to carousel"}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      image.is_featured ? "fill-yellow-400" : ""
                    )}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(image.id, image.url)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 