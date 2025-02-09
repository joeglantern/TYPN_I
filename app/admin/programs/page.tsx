'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Search, Filter, Users, Calendar } from 'lucide-react'
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
import { ProgramForm } from "@/app/admin/components/ProgramForm"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface Program {
  id: string
  title: string
  description: string
  status: 'Active' | 'Upcoming' | 'Completed'
  duration: string
  image_url: string
  created_at: string
  updated_at: string
  start_date: string
  end_date: string
  capacity: number
  enrolled: number
  category: string
  level: string
  format: string
  instructor_name: string
  registration_open: boolean
  registration_deadline: string
}

interface ProgramStats {
  total: number
  active: number
  upcoming: number
  completed: number
  totalEnrolled: number
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [stats, setStats] = useState<ProgramStats>({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    totalEnrolled: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [programToDelete, setProgramToDelete] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [filterFormat, setFilterFormat] = useState<string>('all')

  useEffect(() => {
    fetchPrograms()
  }, [sortOrder, filterStatus, filterCategory, filterLevel, filterFormat])

  async function fetchPrograms() {
    try {
      setIsLoading(true)
      let query = supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: sortOrder === 'asc' })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory)
      }
      if (filterLevel !== 'all') {
        query = query.eq('level', filterLevel)
      }
      if (filterFormat !== 'all') {
        query = query.eq('format', filterFormat)
      }

      const { data, error } = await query

      if (error) throw error

      setPrograms(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function calculateStats(programsData: Program[]) {
    const stats = {
      total: programsData.length,
      active: programsData.filter(p => p.status === 'Active').length,
      upcoming: programsData.filter(p => p.status === 'Upcoming').length,
      completed: programsData.filter(p => p.status === 'Completed').length,
      totalEnrolled: programsData.reduce((sum, p) => sum + (p.enrolled || 0), 0)
    }
    setStats(stats)
  }

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    program.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setPrograms(programs.filter(program => program.id !== id))
      setShowDeleteDialog(false)
      setProgramToDelete(null)
    } catch (error) {
      console.error('Error deleting program:', error)
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
        <div>
        <h1 className="text-3xl font-bold">Programs</h1>
          <p className="text-muted-foreground mt-1">Manage your educational programs</p>
        </div>
        <Button onClick={() => {
          setSelectedProgram(null)
          setShowForm(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Program
        </Button>
      </div>

      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.upcoming} upcoming
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrolled}</div>
            <p className="text-xs text-muted-foreground">
              Across all programs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Programs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">
              Starting soon
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search programs..."
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
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('Active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('Upcoming')}>
              Upcoming
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('Completed')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Category</DropdownMenuLabel>
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
            <DropdownMenuLabel className="text-xs">Sort</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setSortOrder('desc')}>
              Newest First
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('asc')}>
              Oldest First
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-background rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {searchQuery ? 'No programs found matching your search.' : 'No programs yet. Create your first program!'}
                </TableCell>
              </TableRow>
            ) : (
              filteredPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.title}</TableCell>
                  <TableCell>
                    <Badge variant={
                      program.status === 'Active' ? 'default' :
                      program.status === 'Upcoming' ? 'outline' :
                      'secondary'
                    }>
                      {program.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{program.category}</TableCell>
                  <TableCell>{program.instructor_name || '-'}</TableCell>
                  <TableCell>
                    {program.enrolled || 0}/{program.capacity || '∞'}
                  </TableCell>
                  <TableCell>
                    {program.start_date ? format(new Date(program.start_date), 'PP') : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProgram(program)
                          setShowForm(true)
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setProgramToDelete(program.id)
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
              This action cannot be undone. This will permanently delete the program and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => programToDelete && handleDelete(programToDelete)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showForm && (
        <ProgramForm
          initialData={selectedProgram}
          onClose={() => {
            setShowForm(false)
            setSelectedProgram(null)
          }}
          onSuccess={() => {
            setShowForm(false)
            setSelectedProgram(null)
            fetchPrograms()
          }}
        />
      )}
    </div>
  )
} 