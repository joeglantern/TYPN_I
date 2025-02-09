'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface ProgramFormProps {
  initialData?: any
  onClose: () => void
  onSuccess: () => void
}

export function ProgramForm({ initialData, onClose, onSuccess }: ProgramFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    status: initialData?.status || 'Upcoming',
    duration: initialData?.duration || '',
    category: initialData?.category || 'General',
    level: initialData?.level || 'All Levels',
    format: initialData?.format || 'Online',
    instructor_name: initialData?.instructor_name || '',
    start_date: initialData?.start_date || '',
    capacity: initialData?.capacity || 0,
    registration_open: initialData?.registration_open || false
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('programs')
        .upsert({
          id: initialData?.id,
          ...formData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      onSuccess()
      toast.success(`Program ${initialData ? 'updated' : 'created'} successfully`)
    } catch (error) {
      console.error('Error saving program:', error)
      toast.error('Failed to save program')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Program' : 'Create New Program'}</DialogTitle>
          <DialogDescription>
            Fill in the basic details for your program. You can add more details later.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Program Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor Name</Label>
              <Input
                id="instructor"
                value={formData.instructor_name}
                onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Language">Language</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Levels">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData({ ...formData, format: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Upcoming">Upcoming</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 8 weeks"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (0 for unlimited)</Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="h-32"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="registration"
              checked={formData.registration_open}
              onCheckedChange={(checked) => setFormData({ ...formData, registration_open: checked })}
            />
            <Label htmlFor="registration">Open for Registration</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Program'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 