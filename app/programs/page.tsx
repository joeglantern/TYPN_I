'use client'

import { useEffect, useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2, Search, Filter, Calendar, Users, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { format } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClientBoundary } from '@/components/client-boundary'

interface Program {
  id: string
  title: string
  description: string
  status: string
  duration: string
  image_url: string
  created_at: string
  start_date: string
  end_date: string
  capacity: number
  enrolled: number
  instructor_name: string
  instructor_image: string
  location: string
  schedule: string
  category: string
  level: string
  format: string
  registration_open: boolean
  registration_deadline: string
}

// Move the main content to a separate client component
function ProgramsContent() {
  const searchParams = useSearchParams()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterLevel, setFilterLevel] = useState('all')
  const [filterFormat, setFilterFormat] = useState('all')
  const [sortBy, setSortBy] = useState<'date'>('date')
  const router = useRouter()

  useEffect(() => {
    fetchPrograms()
  }, [filterCategory, filterLevel, filterFormat, sortBy])

  const fetchPrograms = async () => {
    try {
      let query = supabase
        .from('programs')
        .select('*')
        .not('status', 'eq', 'Completed')

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory)
      }
      if (filterLevel !== 'all') {
        query = query.eq('level', filterLevel)
      }
      if (filterFormat !== 'all') {
        query = query.eq('format', filterFormat)
      }

      query = query.order('start_date', { ascending: true })

      const { data, error } = await query

      if (error) throw error

      setPrograms(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No programs found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Our Programs</h1>
        <p className="mt-2 text-muted-foreground">
          Discover our range of educational programs designed to help you grow
        </p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-center mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterCategory('all')}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('Technology')}>
                Technology
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('Business')}>
                Business
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('Arts')}>
                Arts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Level</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterLevel('all')}>
                All Levels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel('Beginner')}>
                Beginner
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel('Intermediate')}>
                Intermediate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterLevel('Advanced')}>
                Advanced
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Format</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterFormat('all')}>
                All Formats
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterFormat('In-Person')}>
                In-Person
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterFormat('Online')}>
                Online
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterFormat('Hybrid')}>
                Hybrid
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Sort By
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Start Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No programs found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrograms.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.id}`}
              className="block"
            >
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
              {program.image_url && (
                <div className="relative h-48 w-full">
                  <Image
                    src={program.image_url}
                    alt={program.title}
                    fill
                      className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      program.status === 'Active' ? 'default' :
                      'default'
                    }>
                    {program.status}
                    </Badge>
                    {program.registration_open && (
                      <Badge variant="outline" className="ml-2">
                        Registration Open
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2">{program.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {program.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {program.start_date ? (
                        <span>Starts {format(new Date(program.start_date), 'PP')}</span>
                      ) : (
                        <span>Flexible Start Date</span>
                      )}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{program.duration}</span>
                    </div>
                    {program.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{program.location}</span>
                      </div>
                    )}
                    {program.capacity > 0 && (
                      <div className="flex items-center text-muted-foreground">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{program.enrolled || 0} / {program.capacity} enrolled</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <div className="flex items-center">
                    {program.instructor_image && (
                      <div className="relative h-8 w-8 mr-2">
                        <Image
                          src={program.instructor_image}
                          alt={program.instructor_name || 'Instructor'}
                          fill
                          className="rounded-full object-cover"
                        />
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {program.instructor_name}
                  </span>
                </div>
                  <div className="text-lg font-bold">
                    Free
                </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Default export becomes a simple wrapper with Suspense
export default function ProgramsPage() {
  return (
    <ClientBoundary>
      <ProgramsContent />
    </ClientBoundary>
  )
}
