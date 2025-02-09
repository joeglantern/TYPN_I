import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export type Blog = {
  id: number
  title: string
  description: string
  content: string
  date: string
  author: string
  status: 'Draft' | 'Published'
  created_at: string
  updated_at: string
}

export type Event = {
  id: number
  title: string
  description: string
  date: string
  location: string
  status: 'Upcoming' | 'Registration Open' | 'Completed'
  created_at: string
  updated_at: string
}

export type Program = {
  id: number
  title: string
  description: string
  duration: string
  status: 'Active' | 'Upcoming' | 'Completed'
  participants: number
  created_at: string
  updated_at: string
}

export type GalleryImage = {
  id: number
  title: string
  description: string
  url: string
  category: 'Events' | 'Programs' | 'Community' | 'Other'
  created_at: string
  updated_at: string
}

export type Carousel = {
  id: number
  title: string
  description: string
  image_id: number
  image_url: string
  display_order: number
  active: boolean
  created_at: string
  updated_at?: string
}

// Helper function to upload image to Supabase Storage
export async function uploadImage(file: File, bucket: string = 'gallery') {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${fileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return publicUrl
}

// Helper function to delete image from Supabase Storage
export async function deleteImage(url: string, bucket: string = 'gallery') {
  const filePath = url.split('/').pop()
  if (!filePath) throw new Error('Invalid file URL')

  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath])

  if (error) throw error
} 