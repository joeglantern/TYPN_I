'use client'

import { useState, useEffect } from 'react'
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Textarea } from "../../../components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { supabase } from '../../../lib/supabase'
import { useToast } from "../../../components/ui/use-toast"
import { Loader2, Plus, Pencil, Trash, AlertTriangle, Bell } from "lucide-react"
import { cn } from '../../../lib/utils'

interface Announcement {
  id: number
  title: string
  content: string
  status: 'active' | 'inactive'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string | null
}

type FormData = {
  title: string
  content: string
  status: 'active' | 'inactive'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  start_date: string
  end_date: string
}

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    status: 'active',
    priority: 'normal',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content || !formData.start_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true);
      const submitData = {
        title: formData.title,
        content: formData.content,
        status: formData.status,
        priority: formData.priority,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
      }

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update({
            ...submitData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAnnouncement.id)

        if (error) throw error
        toast({
          title: "Success",
          description: "Announcement updated successfully",
        })
      } else {
        const { data, error } = await supabase
          .from('announcements')
          .insert([submitData])
          .select()
          .single()

        if (error) throw error
        setAnnouncements(prev => [data, ...prev])
        toast({
          title: "Success",
          description: "Announcement created successfully",
        })
      }

      setEditingAnnouncement(null)
      setFormData({
        title: '',
        content: '',
        status: 'active',
        priority: 'normal',
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      })
      setShowDialog(false)
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      content: announcement.content,
      status: announcement.status,
      priority: announcement.priority,
      start_date: new Date(announcement.start_date).toISOString().split('T')[0],
      end_date: announcement.end_date ? new Date(announcement.end_date).toISOString().split('T')[0] : ''
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      })
      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-500'
      case 'high':
        return 'text-orange-500'
      case 'normal':
        return 'text-blue-500'
      case 'low':
        return 'text-green-500'
      default:
        return ''
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
          <h1 className="text-3xl font-bold">Manage Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage announcements for your website
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAnnouncement(null)
              setFormData({
                title: '',
                content: '',
                status: 'active',
                priority: 'normal',
                start_date: new Date().toISOString().split('T')[0],
                end_date: ''
              })
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAnnouncement ? 'Edit' : 'Add'} Announcement</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e as unknown as React.MouseEvent);
            }} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title"
                />
              </div>
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter announcement content"
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <Button 
                type="submit"
                disabled={!formData.title || !formData.content || !formData.start_date || loading} 
                className="w-full"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={cn(
              "border rounded-lg p-4 space-y-2",
              announcement.status === 'inactive' && "opacity-50"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <span className={cn("text-sm font-medium", getPriorityColor(announcement.priority))}>
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {announcement.content}
                </p>
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(announcement)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(announcement.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Start: {new Date(announcement.start_date).toLocaleDateString()}</span>
                {announcement.end_date && (
                  <span>End: {new Date(announcement.end_date).toLocaleDateString()}</span>
                )}
              </div>
              <span>Status: {announcement.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 