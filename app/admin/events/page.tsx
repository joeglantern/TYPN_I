'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ContentForm } from "@/app/admin/components/ContentForm"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface Event {
  id: string
  title: string
  content: string
  date: string
  location: string
  image_url: string
  image_urls: string[]
  created_at: string
  updated_at: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchEvents()
  }, [])

  async function fetchEvents() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: sortOrder === 'asc' })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setEvents(events.filter(event => event.id !== id))
      setShowDeleteDialog(false)
      setEventToDelete(null)
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Events</h1>
        <Button onClick={() => {
          setSelectedEvent(null)
          setShowForm(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Event
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events by title or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setSortOrder('desc')
              fetchEvents()
            }}>
              Latest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setSortOrder('asc')
              fetchEvents()
            }}>
              Earliest First
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-background rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Images</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {searchQuery ? 'No events found matching your search.' : 'No events yet. Create your first event!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {event.image_urls?.length > 0 ? (
                        event.image_urls.map((url, index) => (
                          <div key={url} className="relative w-12 h-12">
                            <img
                              src={url}
                              alt={`${event.title} image ${index + 1}`}
                              className="object-cover w-full h-full rounded"
                            />
                          </div>
                        ))
                      ) : event.image_url ? (
                        <div className="relative w-12 h-12">
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="object-cover w-full h-full rounded"
                          />
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No images</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(event.date), 'PPP')}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{format(new Date(event.created_at), 'PPP')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowForm(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEventToDelete(event.id)
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => eventToDelete && handleDelete(eventToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showForm && (
        <ContentForm
          type="event"
          initialData={selectedEvent}
          onClose={() => {
            setShowForm(false)
            setSelectedEvent(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setSelectedEvent(null)
            fetchEvents()
          }}
        />
      )}
    </div>
  )
} 