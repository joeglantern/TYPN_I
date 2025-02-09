'use client'

import { Button } from "@/components/ui/button"
import { Globe, Users, Lightbulb, MessageCircle, Calendar, Award, BookOpen, Network, ArrowRight, Bell, MessagesSquare, ChevronLeft, ChevronRight, Users2, Rocket, Target } from "lucide-react"
import Link from "next/link"
import { EventsCalendar } from "@/components/events-calendar"
import Image from "next/image"
import { ScrollAnimation } from './components/ScrollAnimation'
import { Carousel } from "@/components/ui/carousel"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Footer } from "./components/Footer"

interface Event {
  id: number
  title: string
  description: string
  date: string
  status: string
  image_url?: string
}

interface GalleryItem {
  id: number
  title: string
  description: string
  url: string
  created_at: string
}

interface Program {
  id: number
  title: string
  description: string
  status: string
  image_url?: string
  created_at: string
}

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  image_url?: string
  featured: boolean
  created_at: string
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const rocketRef = useRef<HTMLButtonElement>(null)
  const rocketAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isSoundLoaded, setIsSoundLoaded] = useState(false)
  const clockAudioRef = useRef<HTMLAudioElement | null>(null)
  const [isClockSoundPlaying, setIsClockSoundPlaying] = useState(false)

  useEffect(() => {
    checkAuth()
    const fetchData = async () => {
      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'Upcoming')
        .order('date', { ascending: true })
        .limit(10)
      
      if (eventsData) setEvents(eventsData as Event[])

      // Fetch gallery images
      const { data: galleryData } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (galleryData) setGallery(galleryData as GalleryItem[])

      // Fetch active programs
      const { data: programsData } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (programsData) setPrograms(programsData as Program[])

      // Fetch featured testimonials
      const { data: testimonialsData } = await supabase
        .from('testimonials')
        .select('*')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6)
      
      if (testimonialsData) setTestimonials(testimonialsData)
    }

    fetchData()

    // Add clock update functionality
    const updateClock = () => {
      const clockElement = document.getElementById('digital-clock')
      if (clockElement) {
        const now = new Date()
        const hours = now.getHours().toString().padStart(2, '0')
        const minutes = now.getMinutes().toString().padStart(2, '0')
        const seconds = now.getSeconds().toString().padStart(2, '0')
        clockElement.textContent = `${hours}:${minutes}:${seconds}`
      }
    }

    const clockInterval = setInterval(updateClock, 1000)
    return () => clearInterval(clockInterval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // Create and load audio element for rocket sound
    const audio = new Audio('/sounds/rocket-sound-effect-128-ytshorts.savetube.me.mp3')
    audio.volume = 0.5
    audio.addEventListener('canplaythrough', () => {
      setIsSoundLoaded(true)
      rocketAudioRef.current = audio
    })
    audio.addEventListener('error', (e) => {
      console.error('Error loading sound:', e)
    })
    
    return () => {
      if (rocketAudioRef.current) {
        rocketAudioRef.current.pause()
        rocketAudioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    // Initialize clock sound
    const clockAudio = new Audio('/sounds/fast-ticking-clock-sound-effect-128-ytshorts.savetube.me.mp3')
    clockAudio.volume = 0.2
    clockAudio.loop = true
    clockAudioRef.current = clockAudio

    return () => {
      if (clockAudioRef.current) {
        clockAudioRef.current.pause()
        clockAudioRef.current = null
      }
    }
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
  }

  const scrollToTop = () => {
    setIsLaunching(true)
    
    // Play sound effect if loaded
    if (rocketAudioRef.current && isSoundLoaded) {
      try {
        rocketAudioRef.current.currentTime = 0
        const playPromise = rocketAudioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing sound:", error)
          })
        }
      } catch (error) {
        console.error("Error playing sound:", error)
      }
    }
    
    // Start scrolling after rocket starts launching
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }, 200)

    // Reset launching state after animation
    setTimeout(() => {
      setIsLaunching(false)
    }, 1500)
  }

  const FeaturedTestimonials = () => {
    if (!testimonials.length) return null

    return (
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What People Say About Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-4">
                      {testimonial.image_url ? (
                        <AvatarImage src={testimonial.image_url} alt={testimonial.name} />
                      ) : (
                        <AvatarFallback>{testimonial.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>
                    <blockquote className="text-lg mb-4">{testimonial.content}</blockquote>
                    <footer>
                      <cite className="not-italic font-semibold">{testimonial.name}</cite>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </footer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link href="/testimonials">View All Testimonials</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  useEffect(() => {
    const scrollRevealElements = document.querySelectorAll('.scroll-reveal');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px'
    });

    scrollRevealElements.forEach(element => {
      observer.observe(element);
    });

    return () => {
      scrollRevealElements.forEach(element => {
        observer.unobserve(element);
      });
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -left-4 w-96 h-96 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob" />
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-yellow-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/3 -right-4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#000 70%,transparent 100%)" />
        </div>

        <div className="container px-4 py-16 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="relative mb-8 inline-block scroll-reveal scale-up">
              <Image
                src="/logo.png"
                alt="TYPNI Logo"
                width={160}
                height={160}
                className="animate-float"
                priority
                unoptimized
              />
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-20 blur-2xl animate-pulse" />
            </div>
            
            <h1 className="text-6xl font-bold mb-6 scroll-reveal fade-up">
              <span className="block text-7xl bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-4">
                Niaje!
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                Connect. Empower. Change.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 scroll-reveal fade-up delay-200">
              Empowering youth through global connections and opportunities. Join our mission to create positive change in communities worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 scroll-reveal fade-up delay-300">
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button asChild size="lg" className="w-full sm:w-auto group bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-opacity">
                  <Link href={isAuthenticated ? "/volunteer" : "/auth/login"}>
                    {isAuthenticated ? "Start Volunteering" : "Sign In"}
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto group">
                  <Link href="/about">
                    Learn More
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto group">
                  <Link href="/announcements">
                    Announcements
                    <Bell className="ml-2 w-5 h-5 animate-bounce" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto group bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:opacity-90 transition-opacity">
                  <Link href="/chat">
                    Join Chat
                    <MessagesSquare className="ml-2 w-5 h-5 animate-bounce" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute left-4 top-1/2 w-24 h-24 border-4 border-primary/20 rounded-full animate-spin-slow" />
            <div className="absolute right-4 bottom-1/4 w-16 h-16 border-4 border-primary/20 rounded-full animate-bounce-slow" />
            <div className="absolute right-1/4 top-1/4 w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Gallery Carousel */}
      <section className="container px-4 py-12 bg-muted/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Photo Gallery</h2>
          <Button asChild variant="outline">
            <Link href="/gallery">
              View All Photos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="relative">
          <Carousel
            aspectRatio="video"
            className="mb-12"
          />
        </div>
      </section>

      {/* Features Section with Enhanced Scroll Animations */}
      <section className="container px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500 scroll-reveal fade-up">
            Why Choose TYPNI?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto scroll-reveal fade-up delay-200">
            Join a community that empowers youth and drives positive change globally
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          {
            title: "Community Forums",
              description: "Connect with like-minded individuals and share your ideas in our vibrant community spaces.",
              icon: Users2,
              gradient: "from-blue-500 to-cyan-500",
              animation: "hover:rotate-6"
          },
          {
            title: "Global Events",
              description: "Participate in workshops, webinars, and conferences with participants from around the world.",
              icon: Globe,
              gradient: "from-purple-500 to-pink-500",
              animation: "hover:-rotate-6"
          },
          {
            title: "Skill Development",
              description: "Access curated resources and courses to enhance your abilities and grow professionally.",
              icon: Target,
              gradient: "from-orange-500 to-red-500",
              animation: "hover:rotate-6"
          },
          {
            title: "Innovative Projects",
              description: "Collaborate on cutting-edge initiatives that create real impact in communities.",
              icon: Rocket,
              gradient: "from-green-500 to-emerald-500",
              animation: "hover:-rotate-6"
          },
          {
            title: "Cultural Exchange",
              description: "Broaden your horizons through meaningful international connections and experiences.",
            icon: Globe,
              gradient: "from-indigo-500 to-purple-500",
              animation: "hover:rotate-6"
          },
          {
            title: "Leadership Opportunities",
              description: "Take charge and lead impactful community projects that make a difference.",
            icon: Award,
              gradient: "from-pink-500 to-rose-500",
              animation: "hover:-rotate-6"
          },
        ].map((feature, index) => (
            <div 
            key={feature.title}
            className={cn(
                "group relative overflow-hidden rounded-xl border bg-gradient-to-b from-background/50 to-background/10 p-8 hover:shadow-2xl transition-all duration-500",
                "hover:-translate-y-2 transform-gpu perspective-1000",
                feature.animation,
                "scroll-reveal",
                index % 2 === 0 ? "slide-in-left" : "slide-in-right",
                `delay-${(index + 1) * 100}`
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                   style={{
                     background: `linear-gradient(to bottom right, var(--${feature.gradient.split('-')[1]}-500), var(--${feature.gradient.split('-')[2]}))`
                   }} />
              
              <div className="relative z-10">
                <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-primary/20 group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br from-background to-muted">
                  <feature.icon 
                    className={cn(
                      "w-8 h-8 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12",
                      "text-foreground"
                    )} 
                  />
                </div>
                
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                <p className="text-muted-foreground group-hover:text-foreground/90 transition-colors duration-300">{feature.description}</p>
              </div>

              {/* 3D Hover Effect Highlights */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
                <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-primary to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Clock Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background" />
        <div className="container px-4 relative">
          <div className="flex flex-col items-center justify-center space-y-8">
            <h2 className="text-5xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-gradient">
              Your Time Is Now
            </h2>
            
            <div className="relative group cursor-pointer"
                 onClick={() => {
                   if (clockAudioRef.current) {
                     if (isClockSoundPlaying) {
                       clockAudioRef.current.pause()
                       clockAudioRef.current.currentTime = 0
                       setIsClockSoundPlaying(false)
                     } else {
                       clockAudioRef.current.play().catch(console.error)
                       setIsClockSoundPlaying(true)
                     }
                   }
                 }}>
              <div className="absolute -inset-4 bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-full blur-2xl opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
              
              <div className="relative w-[400px] h-[400px] rounded-full bg-black/90 p-8">
                <div className="absolute inset-0 flex items-center justify-center opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                  <Image
                    src="/logo.png"
                    alt="TYPNI Logo"
                    width={300}
                    height={300}
                    className="animate-pulse-slow"
                  />
                </div>
                
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-spin-slow" />
                  <div className="absolute inset-2 rounded-full border-2 border-primary/10 animate-spin" style={{ animationDuration: '15s' }} />
                  
                  <div className="text-center z-10 transform hover:scale-110 transition-all duration-300">
                    <div className="text-6xl font-mono font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-pulse-slow tracking-wider" id="digital-clock">
                      {new Date().toLocaleTimeString()}
                    </div>
                    <div className="mt-4 text-lg text-primary/80 font-medium tracking-wider">
                      {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>

        <div className="container relative">
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-background/80 backdrop-blur-lg rounded-2xl p-8 md:p-12 shadow-2xl border border-primary/10">
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/30 rounded-full blur-2xl animate-pulse-slow" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-pulse-slow animation-delay-500" />
              
              <div className="relative space-y-8">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-indigo-500 pb-2">
                    Ready to Make an Impact?
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Join our global community and start making a difference today.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <div 
                    className="group relative overflow-hidden rounded-xl p-8 hover:shadow-2xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-primary/5 via-primary/10 to-purple-500/5 border border-primary/10 hover:border-primary/20"
                    onClick={() => window.location.href = isAuthenticated ? "/volunteer" : "/auth/login"}
                  >
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-2 text-primary group-hover:text-primary/80 transition-colors">
                        Get Started
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {isAuthenticated 
                          ? "Start your volunteering journey and make an impact." 
                          : "Create your account and join our community."}
                      </p>
                      <div className="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                        <span className="font-semibold mr-2">
                          {isAuthenticated ? "Start Volunteering" : "Sign Up Now"}
                        </span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div 
                    className="group relative overflow-hidden rounded-xl p-8 hover:shadow-2xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-purple-500/5 via-indigo-500/10 to-primary/5 border border-primary/10 hover:border-primary/20"
                    onClick={() => window.location.href = "/about"}
                  >
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-2 text-primary group-hover:text-primary/80 transition-colors">
                        Learn More
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Discover how we're making a difference and how you can contribute.
                      </p>
                      <div className="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                        <span className="font-semibold mr-2">Explore Our Mission</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 mt-8 border-t border-primary/10">
                  <div className="text-center group">
                    <div className="text-xl font-bold text-primary group-hover:scale-105 transition-transform">
                      <span className="animate-pulse inline-block">Still</span>
                      <span className="animate-pulse animation-delay-200 inline-block ml-1">Counting</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Future Volunteers</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-xl font-bold text-primary group-hover:scale-105 transition-transform">
                      <span className="animate-pulse inline-block">Still</span>
                      <span className="animate-pulse animation-delay-200 inline-block ml-1">Counting</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Countries to Reach</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-xl font-bold text-primary group-hover:scale-105 transition-transform">
                      <span className="animate-pulse inline-block">Still</span>
                      <span className="animate-pulse animation-delay-200 inline-block ml-1">Counting</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Future Projects</div>
                  </div>
                  <div className="text-center group">
                    <div className="text-xl font-bold text-primary group-hover:scale-105 transition-transform">
                      <span className="animate-pulse inline-block">Still</span>
                      <span className="animate-pulse animation-delay-200 inline-block ml-1">Counting</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Lives to Impact</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Calendar Section */}
      <section className="container px-4">
        <ScrollAnimation>
          <EventsCalendar />
        </ScrollAnimation>
      </section>

      {/* Volunteer CTA */}
      <section className="container px-4 text-center space-y-6">
        <h2 className="text-3xl font-bold">Volunteer with Us</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join our global network of volunteers and make a difference in communities worldwide.
        </p>
        <Button asChild size="lg">
          <Link href="/volunteer">Sign Up to Volunteer</Link>
        </Button>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 overflow-hidden font-mono">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pt-8 pb-12">
          <div className="container px-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
                Voices of Youth Impact
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Hear from young leaders who have transformed their lives through our community and programs
              </p>
            </div>
          </div>
        </div>
        
        {/* Scrolling Content */}
        <div className="container px-4">
          <div className="relative flex flex-col md:flex-row justify-center gap-4 md:gap-8">
            {/* First Column */}
            <div className="flex flex-col gap-6 animate-scroll-up hover:pause w-full md:w-[350px]">
              {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className="w-full md:w-[350px] flex-shrink-0 rounded-xl bg-card p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      {testimonial.image_url ? (
                        <AvatarImage src={testimonial.image_url} alt={testimonial.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/5 text-primary">
                          {testimonial.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium text-base group-hover:text-primary transition-colors">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground font-normal">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-300 font-normal group-hover:text-primary/90 transition-colors">
                    "{testimonial.content}"
                  </p>
                </div>
              ))}
            </div>

            {/* Second Column - Hidden on Mobile */}
            <div className="hidden md:flex flex-col gap-6 animate-scroll-up-delayed mt-[-200px] w-[350px] hover:pause">
              {[...testimonials, ...testimonials, ...testimonials].map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}-reverse`}
                  className="w-full md:w-[350px] flex-shrink-0 rounded-xl bg-card p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-800 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      {testimonial.image_url ? (
                        <AvatarImage src={testimonial.image_url} alt={testimonial.name} />
                      ) : (
                        <AvatarFallback className="bg-primary/5 text-primary">
                          {testimonial.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium text-base group-hover:text-primary transition-colors">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground font-normal">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed text-gray-600 dark:text-gray-300 font-normal group-hover:text-primary/90 transition-colors">
                    "{testimonial.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          ref={rocketRef}
          onClick={scrollToTop}
          className={cn(
            "rocket-btn",
            isLaunching && "rocket-launch"
          )}
          aria-label="Back to top"
        >
          <Rocket 
            className={cn(
              "w-6 h-6 text-white rocket-icon",
              isLaunching && "launching"
            )} 
          />
        </button>
      )}

      {/* Audio element for rocket sound */}
      <audio id="rocket-sound" src="/sounds/rocket-launch.mp3" preload="auto" />
    </div>
  )
} 