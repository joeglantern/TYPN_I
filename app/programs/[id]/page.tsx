'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { Loader2, Calendar, Clock, MapPin, Users, GraduationCap, Book, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

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
  instructor_bio: string
  instructor_image: string
  location: string
  schedule: string
  prerequisites: string[]
  learning_outcomes: string[]
  syllabus: Record<string, any>
  category: string
  level: string
  format: string
  registration_open: boolean
  registration_deadline: string
  materials_included: string[]
  certification_offered: boolean
  certification_details: string
  language: string
  video_url: string
  faqs: Record<string, any>[]
}

export default function ProgramPage() {
  const { id } = useParams()
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchProgram()
  }, [id])

  const fetchProgram = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setProgram(data)
    } catch (error) {
      console.error('Error fetching program:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!program) return

    try {
      setEnrolling(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Redirect to login
        window.location.href = `/login?redirect=/programs/${id}`
        return
      }

      const { error } = await supabase.rpc('enroll_in_program', {
        p_program_id: program.id,
        p_user_id: session.user.id,
        p_payment_amount: 0 // Always free
      })

      if (error) throw error

      // Refresh program data
      fetchProgram()
    } catch (error) {
      console.error('Error enrolling in program:', error)
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-center text-muted-foreground">Program not found.</p>
      </div>
    )
  }

  const isRegistrationClosed = program.registration_deadline && new Date(program.registration_deadline) < new Date()
  const isFull = program.capacity > 0 && program.enrolled >= program.capacity

  return (
    <div className="container mx-auto py-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
        {program.image_url && (
          <div className="relative h-[400px] overflow-hidden rounded-lg">
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
        
        <div className="space-y-6">
          <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={
                  program.status === 'Active' ? 'default' :
                  program.status === 'Upcoming' ? 'secondary' :
                  'outline'
                }>
                  {program.status}
                </Badge>
                <Badge variant="outline">{program.category}</Badge>
                <Badge variant="outline">{program.level}</Badge>
                <Badge variant="outline">{program.format}</Badge>
                {program.certification_offered && (
                  <Badge variant="outline">Certification Available</Badge>
                )}
              </div>
            <h1 className="text-4xl font-bold">{program.title}</h1>
          </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="faqs">FAQs</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-6">
                <div className="prose max-w-none">
                  <h2>About This Program</h2>
                  <p>{program.description}</p>
          </div>

                {program?.learning_outcomes?.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Learning Outcomes</h2>
                    <ul className="list-disc list-inside space-y-2">
                      {program?.learning_outcomes?.map((outcome, index) => (
                        <li key={index} className="flex items-start">
                          <span className="ml-2">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {program?.prerequisites?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Prerequisites</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {program?.prerequisites?.map((prerequisite, index) => (
                        <li key={index}>{prerequisite}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {program?.materials_included?.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Materials Included</h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {program?.materials_included?.map((material, index) => (
                        <li key={index}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {program.certification_offered && program.certification_details && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Certification</h3>
                    <p>{program.certification_details}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="syllabus" className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  {program?.syllabus && Object.entries(program.syllabus).map(([module, content]: [string, any], index) => (
                    <AccordionItem key={index} value={`module-${index}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Book className="h-5 w-5" />
                          <span>{module}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-7 space-y-4">
                          {Array.isArray(content) ? (
                            <ul className="list-disc pl-5 space-y-2">
                              {content.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{content}</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              <TabsContent value="instructor" className="space-y-6">
                <div className="flex items-start gap-6">
                  {program.instructor_image && (
                    <div className="relative h-32 w-32 flex-shrink-0">
                      <Image
                        src={program.instructor_image}
                        alt={program.instructor_name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">{program.instructor_name}</h3>
                    <p className="text-muted-foreground">{program.instructor_bio}</p>
                  </div>
            </div>
              </TabsContent>

              <TabsContent value="faqs" className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  {program.faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-5 w-5 mr-2" />
                  {program.start_date ? (
                    <span>Starts {format(new Date(program.start_date), 'PP')}</span>
                  ) : (
                    <span>Flexible Start Date</span>
                  )}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>{program.duration}</span>
                </div>
                {program.location && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{program.location}</span>
                  </div>
                )}
                {program.schedule && (
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-5 w-5 mr-2" />
                    <span>{program.schedule}</span>
                  </div>
                )}
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-5 w-5 mr-2" />
                  <span>
                    {program.enrolled || 0}
                    {program.capacity > 0 ? ` / ${program.capacity}` : ''} enrolled
                  </span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  <span>{program.language}</span>
                </div>
              </div>

              <div className="space-y-4">
                {program.registration_deadline && (
                  <p className="text-sm text-muted-foreground">
                    Registration deadline: {format(new Date(program.registration_deadline), 'PP')}
                  </p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  disabled={
                    !program.registration_open ||
                    isRegistrationClosed ||
                    isFull ||
                    enrolling
                  }
                  onClick={handleEnroll}
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : !program.registration_open ? (
                    'Registration Closed'
                  ) : isRegistrationClosed ? (
                    'Registration Deadline Passed'
                  ) : isFull ? (
                    'Program Full'
                  ) : (
                    'Enroll Now - Free'
                  )}
                </Button>

                {program.video_url && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={program.video_url}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 