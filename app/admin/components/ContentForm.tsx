'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import imageCompression from 'browser-image-compression'
import { Checkbox } from "@/components/ui/checkbox"

interface ContentFormProps {
  type: 'blog' | 'event' | 'program'
  initialData?: any
  onClose: () => void
  onSuccess: () => void
}

export function ContentForm({ type, initialData, onClose, onSuccess }: ContentFormProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [status, setStatus] = useState(initialData?.status || 'Upcoming')
  const [duration, setDuration] = useState(initialData?.duration || '')
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '')
  const [startDate, setStartDate] = useState(initialData?.start_date || '')
  const [endDate, setEndDate] = useState(initialData?.end_date || '')
  const [capacity, setCapacity] = useState(initialData?.capacity || 0)
  const [price, setPrice] = useState(initialData?.price || '')
  const [instructorName, setInstructorName] = useState(initialData?.instructor_name || '')
  const [instructorBio, setInstructorBio] = useState(initialData?.instructor_bio || '')
  const [instructorImage, setInstructorImage] = useState(initialData?.instructor_image || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [schedule, setSchedule] = useState(initialData?.schedule || '')
  const [prerequisites, setPrerequisites] = useState<string[]>(initialData?.prerequisites || [])
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(initialData?.learning_outcomes || [])
  const [syllabus, setSyllabus] = useState<Record<string, any>>(initialData?.syllabus || {})
  const [category, setCategory] = useState(initialData?.category || 'General')
  const [level, setLevel] = useState(initialData?.level || 'All Levels')
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false)
  const [registrationOpen, setRegistrationOpen] = useState(initialData?.registration_open || false)
  const [registrationDeadline, setRegistrationDeadline] = useState(initialData?.registration_deadline || '')
  const [tags, setTags] = useState<string[]>(initialData?.tags || [])
  const [materialsIncluded, setMaterialsIncluded] = useState<string[]>(initialData?.materials_included || [])
  const [certificationOffered, setCertificationOffered] = useState(initialData?.certification_offered || false)
  const [certificationDetails, setCertificationDetails] = useState(initialData?.certification_details || '')
  const [language, setLanguage] = useState(initialData?.language || 'English')
  const [format, setFormat] = useState(initialData?.format || 'In-Person')
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || '')
  const [faqs, setFaqs] = useState<Record<string, any>>(initialData?.faqs || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = async (files: FileList) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      // Check if events bucket exists and create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets()
      if (!buckets?.find(b => b.name === 'events')) {
        await supabase.storage.createBucket('events', {
          public: true,
          fileSizeLimit: 5242880 // 5MB
        })
      }

      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed')
        }

        // Compress image before upload
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true
        })

        const fileExt = file.name.split('.').pop()
        const timestamp = new Date().getTime()
        const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${session.user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, compressedFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        // Get the public URL immediately after successful upload
        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      // Update both imageUrl and imageUrls
      if (uploadedUrls.length > 0) {
        setImageUrl(uploadedUrls[0])
      }

      return uploadedUrls
    } catch (error: any) {
      const errorMessage = error.message || "Failed to upload image"
      console.error('Error uploading image:', errorMessage)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      // Validate required fields
      if (!title.trim()) throw new Error('Title is required')
      if (!description.trim()) throw new Error('Description is required')
      if (type === 'event') {
        if (!startDate || !endDate || !location.trim()) throw new Error('Start date, end date, and location are required for events')
      }
      if (type === 'program' && !duration.trim()) throw new Error('Duration is required for programs')

      // Handle image upload if there are files
      const fileInput = e.target as HTMLFormElement;
      const files = fileInput.querySelector('input[type="file"]') as HTMLInputElement;
      let finalImageUrl = imageUrl;

      if (files?.files?.length) {
        try {
          const uploadedUrls = await handleImageUpload(files.files);
          if (uploadedUrls?.length > 0) {
            finalImageUrl = uploadedUrls[0];
          }
        } catch (error: any) {
          throw new Error(`Failed to upload images: ${error.message}`);
        }
      }

      const table = type === 'blog' ? 'blogs' : type === 'event' ? 'events' : 'programs'
      
      // Base data structure
      const baseData = {
        created_by: session.user.id,
        updated_by: session.user.id,
        updated_at: new Date().toISOString()
      }

      // Type-specific data with final image URLs
      const typeData = type === 'event' ? {
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        location: location.trim(),
        status: 'upcoming',
        image_url: finalImageUrl
      } : type === 'program' ? {
        title: title.trim(),
        description: description.trim(),
        status,
        duration: duration.trim(),
        image_url: finalImageUrl,
        start_date: startDate,
        end_date: endDate,
        capacity,
        price,
        instructor_name: instructorName,
        instructor_bio: instructorBio,
        instructor_image: instructorImage,
        schedule: schedule.trim(),
        prerequisites: prerequisites.join(','),
        learning_outcomes: learningOutcomes.join(','),
        syllabus: JSON.stringify(syllabus),
        category,
        level,
        is_featured: isFeatured,
        registration_open: registrationOpen,
        registration_deadline: registrationDeadline,
        tags: tags.join(','),
        materials_included: materialsIncluded.join(','),
        certification_offered: certificationOffered,
        certification_details: certificationDetails,
        language,
        format,
        video_url: videoUrl,
        faqs: JSON.stringify(faqs)
      } : {
        title: title.trim(),
        description: description.trim(),
        image_url: finalImageUrl
      }

      let result;
      if (initialData?.id) {
        const { data: updateData, error: updateError } = await supabase
          .from(table)
          .update({ ...typeData, ...baseData })
          .eq('id', initialData.id)
          .select()

        if (updateError) throw updateError
        result = updateData
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from(table)
          .insert([{
            ...typeData,
            ...baseData,
            created_at: new Date().toISOString()
          }])
          .select()

        if (insertError) throw insertError
        result = insertData
      }

      if (!result || result.length === 0) {
        throw new Error('No data returned from operation')
      }

      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} ${initialData ? 'updated' : 'created'} successfully`,
      })
      onSuccess()
    } catch (error: any) {
      const errorMessage = error.message || "Failed to save content"
      console.error('Error:', errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit' : 'Add'} {type === 'blog' ? 'Blog Post' : type === 'event' ? 'Event' : 'Program'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Enter ${type} title`}
              required
            />
          </div>

          {type === 'event' && (
            <>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter event location"
                  required
                />
              </div>
            </>
          )}

          {type === 'program' && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Arts">Arts</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Language">Language</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="All Levels">All Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In-Person">In-Person</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 6 months, 12 weeks"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    type="number"
                    id="capacity"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    type="number"
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter price (0 for free)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input
                    id="schedule"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="e.g., Mon & Wed 6-8 PM"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="Enter language"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instructorName">Instructor Name</Label>
                  <Input
                    id="instructorName"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="Enter instructor name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructorBio">Instructor Bio</Label>
                  <Textarea
                    id="instructorBio"
                    value={instructorBio}
                    onChange={(e) => setInstructorBio(e.target.value)}
                    placeholder="Enter instructor bio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructorImage">Instructor Image URL</Label>
                  <Input
                    id="instructorImage"
                    value={instructorImage}
                    onChange={(e) => setInstructorImage(e.target.value)}
                    placeholder="Enter instructor image URL"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prerequisites">Prerequisites (comma-separated)</Label>
                  <Input
                    id="prerequisites"
                    value={prerequisites.join(', ')}
                    onChange={(e) => setPrerequisites(e.target.value.split(',').map(item => item.trim()))}
                    placeholder="Enter prerequisites"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="learningOutcomes">Learning Outcomes (comma-separated)</Label>
                  <Input
                    id="learningOutcomes"
                    value={learningOutcomes.join(', ')}
                    onChange={(e) => setLearningOutcomes(e.target.value.split(',').map(item => item.trim()))}
                    placeholder="Enter learning outcomes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags.join(', ')}
                    onChange={(e) => setTags(e.target.value.split(',').map(item => item.trim()))}
                    placeholder="Enter tags"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="materialsIncluded">Materials Included (comma-separated)</Label>
                  <Input
                    id="materialsIncluded"
                    value={materialsIncluded.join(', ')}
                    onChange={(e) => setMaterialsIncluded(e.target.value.split(',').map(item => item.trim()))}
                    placeholder="Enter materials included"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={isFeatured}
                    onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                  />
                  <Label htmlFor="isFeatured">Featured Program</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="registrationOpen"
                    checked={registrationOpen}
                    onCheckedChange={(checked) => setRegistrationOpen(checked as boolean)}
                  />
                  <Label htmlFor="registrationOpen">Registration Open</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    type="date"
                    id="registrationDeadline"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="certificationOffered"
                    checked={certificationOffered}
                    onCheckedChange={(checked) => setCertificationOffered(checked as boolean)}
                  />
                  <Label htmlFor="certificationOffered">Certification Offered</Label>
                </div>

                {certificationOffered && (
                  <div className="space-y-2">
                    <Label htmlFor="certificationDetails">Certification Details</Label>
                    <Textarea
                      id="certificationDetails"
                      value={certificationDetails}
                      onChange={(e) => setCertificationDetails(e.target.value)}
                      placeholder="Enter certification details"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter program description"
                    className="min-h-[200px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syllabus">Syllabus (JSON format)</Label>
                  <Textarea
                    id="syllabus"
                    value={JSON.stringify(syllabus, null, 2)}
                    onChange={(e) => {
                      try {
                        setSyllabus(JSON.parse(e.target.value))
                      } catch (error) {
                        // Allow invalid JSON while typing
                      }
                    }}
                    placeholder="Enter syllabus in JSON format"
                    className="min-h-[200px] font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faqs">FAQs (JSON format)</Label>
                  <Textarea
                    id="faqs"
                    value={JSON.stringify(faqs, null, 2)}
                    onChange={(e) => {
                      try {
                        setFaqs(JSON.parse(e.target.value))
                      } catch (error) {
                        // Allow invalid JSON while typing
                      }
                    }}
                    placeholder="Enter FAQs in JSON format"
                    className="min-h-[200px] font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="image">Images</Label>
            {type === 'event' ? (
              <Input
                id="image"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="cursor-pointer"
              />
            ) : (
              <Input
                id="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter image URL"
              />
            )}
            {type === 'event' && imageUrl && (
              <div className="relative aspect-video">
                <img
                  src={imageUrl}
                  alt="Event image"
                      className="rounded-lg object-cover w-full h-full"
                    />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 