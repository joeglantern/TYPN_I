'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Announcement {
  id: number
  title: string
  content: string
  status: 'active' | 'inactive'
  priority: 'low' | 'normal' | 'high'
  start_date: string
  end_date: string | null
  created_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const currentDate = new Date().toISOString()
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'active')
        .lte('start_date', currentDate)
        .or(`end_date.gt.${currentDate},end_date.is.null`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Announcements</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Stay updated with the latest news and announcements from TYPNI.
        </p>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active announcements at this time.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{announcement.title}</CardTitle>
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{announcement.content}</p>
                <div className="mt-4 text-sm text-muted-foreground">
                  {new Date(announcement.start_date).toLocaleDateString()}
                  {announcement.end_date && (
                    <> - {new Date(announcement.end_date).toLocaleDateString()}</>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 