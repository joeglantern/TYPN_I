'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Plus, ArrowUp, ArrowDown, Image } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface CarouselItem {
  id: string
  title: string
  description: string | null
  image_url: string
  link_url: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CarouselsPage() {
  const router = useRouter()
  const [items, setItems] = useState<CarouselItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true
  })
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      fetchItems()
    }
    checkSession()
  }, [])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('carousel_items')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (error: any) {
      console.error('Error fetching carousel items:', error)
      toast.error('Failed to fetch carousel items')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `carousel/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath)

      setFormData(prev => ({ ...prev, image_url: publicUrl }))
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newItem = {
        ...formData,
        order_index: items.length // Add at the end
      }

      const { error } = await supabase
        .from('carousel_items')
        .insert(newItem)

      if (error) throw error

      toast.success('Carousel item added successfully')
      setShowAddDialog(false)
      setFormData({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        is_active: true
      })
      fetchItems()
    } catch (error: any) {
      console.error('Error adding carousel item:', error)
      toast.error(error.message || 'Failed to add carousel item')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    try {
      const { error } = await supabase
        .from('carousel_items')
        .update(formData)
        .eq('id', selectedItem.id)

      if (error) throw error

      toast.success('Carousel item updated successfully')
      setShowEditDialog(false)
      setSelectedItem(null)
      fetchItems()
    } catch (error: any) {
      console.error('Error updating carousel item:', error)
      toast.error(error.message || 'Failed to update carousel item')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('carousel_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Carousel item deleted successfully')
      fetchItems()
    } catch (error: any) {
      console.error('Error deleting carousel item:', error)
      toast.error(error.message || 'Failed to delete carousel item')
    }
  }

  const handleMove = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase.rpc('update_carousel_order', {
        p_item_id: id,
        p_new_order: newOrder
      })

      if (error) throw error

      fetchItems()
    } catch (error: any) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carousel Management</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMove(item.id, index - 1)}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                      )}
                      {index < items.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMove(item.id, index + 1)}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      )}
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell>
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-16 w-24 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {item.link_url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.is_active}
                      onCheckedChange={async (checked) => {
                        try {
                          const { error } = await supabase
                            .from('carousel_items')
                            .update({ is_active: checked })
                            .eq('id', item.id)

                          if (error) throw error
                          fetchItems()
                        } catch (error: any) {
                          console.error('Error updating status:', error)
                          toast.error('Failed to update status')
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(item)
                          setFormData({
                            title: item.title,
                            description: item.description || '',
                            image_url: item.image_url,
                            link_url: item.link_url,
                            is_active: item.is_active
                          })
                          setShowEditDialog(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Carousel Item</DialogTitle>
            <DialogDescription>
              Add a new item to the carousel. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label>Image</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                  required={!formData.image_url}
                />
                {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="mt-2 h-32 w-48 object-cover rounded"
                />
              )}
            </div>
            <div className="space-y-2">
              <label>Link URL</label>
              <Input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <label>Active</label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={uploadingImage}>
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Add Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Carousel Item</DialogTitle>
            <DialogDescription>
              Update the carousel item details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <label>Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label>Image</label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
                {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="mt-2 h-32 w-48 object-cover rounded"
                />
              )}
            </div>
            <div className="space-y-2">
              <label>Link URL</label>
              <Input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <label>Active</label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={uploadingImage}>
                {uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Update Item'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 