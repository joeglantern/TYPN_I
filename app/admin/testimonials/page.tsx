'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { supabase } from '@/lib/supabase'
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Pencil, Trash } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { compressImage } from "@/lib/compressImage"

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  image_url?: string
  featured: boolean
  created_at: string
}

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    content: '',
    image_url: '',
    featured: false
  })
  const { toast } = useToast()

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
      toast({
        title: "Error",
        description: "Failed to fetch testimonials",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.role || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(formData)
          .eq('id', editingTestimonial.id)

        if (error) throw error
        toast({
          title: "Success",
          description: "Testimonial updated successfully",
        })
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([formData])

        if (error) throw error
        toast({
          title: "Success",
          description: "Testimonial created successfully",
        })
      }

      setShowDialog(false)
      setEditingTestimonial(null)
      setFormData({
        name: '',
        role: '',
        content: '',
        image_url: '',
        featured: false
      })
      fetchTestimonials()
    } catch (error) {
      console.error('Error saving testimonial:', error)
      toast({
        title: "Error",
        description: "Failed to save testimonial",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      content: testimonial.content,
      image_url: testimonial.image_url || '',
      featured: testimonial.featured
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      })
      fetchTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      // Compress image before upload
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true
      })

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('testimonials')
        .upload(filePath, compressedFile)

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('No data returned from upload')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading image:', error.message || 'Unknown error')
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      })
      throw error
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Manage Testimonials</h1>
          <p className="text-sm text-muted-foreground">
            Add and manage testimonials from your community members
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTestimonial(null)
              setFormData({
                name: '',
                role: '',
                content: '',
                image_url: '',
                featured: false
              })
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTestimonial ? 'Edit' : 'Add'} Testimonial</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Enter role"
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter testimonial content"
                  rows={4}
                />
              </div>
              <div>
                <Label>Image (Optional)</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageUpload(file)
                      }
                    }}
                    disabled={uploadingImage}
                  />
                  {formData.image_url && (
                    <div className="relative h-20 w-20 mx-auto">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={formData.image_url} alt="Preview" />
                        <AvatarFallback>{formData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
                <Label htmlFor="featured">Featured on Homepage</Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTestimonial ? 'Update' : 'Create'} Testimonial
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    {testimonial.image_url ? (
                      <AvatarImage src={testimonial.image_url} alt={testimonial.name} />
                    ) : (
                      <AvatarFallback>{testimonial.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(testimonial)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(testimonial.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{testimonial.content}</p>
              {testimonial.featured && (
                <div className="mt-2">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Featured
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 