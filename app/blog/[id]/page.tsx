'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ReadingSettings } from '../components/ReadingSettings'
import { Comments } from '../components/Comments'
import { format } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Share2, Bookmark, BookmarkCheck, ArrowUp, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface BlogPost {
  id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
  author_name: string
  author_avatar_url: string | null
  category: {
    id: number
    name: string
    slug: string
    color: string
  } | null
  estimated_read_time?: number
}

export default function BlogPostPage() {
  const params = useParams()
  const postId = params.id as string
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [fontSize, setFontSize] = useState(100)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechSynthesis(window.speechSynthesis)
    }

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  async function fetchBlog() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          blog_categories (
            id,
            name,
            slug,
            color
          )
        `)
        .eq('id', postId)
        .single()

      if (error) throw error

      setBlog({
        ...data,
        category: data.blog_categories,
        estimated_read_time: Math.ceil(data.content.split(' ').length / 200)
      })
    } catch (error) {
      console.error('Error fetching blog:', error)
      toast.error('Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (postId) {
      fetchBlog()
    }
  }, [postId])

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: blog?.title,
          text: blog?.content.substring(0, 100) + '...',
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard')
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleBookmark = () => {
    // TODO: Implement bookmarking functionality
    toast.success('Bookmark feature coming soon!')
  }

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTextToSpeech = () => {
    if (!speechSynthesis || !blog?.content) return;

    if (isReading) {
      speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    // Clean the content: remove HTML tags and image markdown
    const cleanContent = blog.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image markdown
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanContent);
    utterance.onend = () => setIsReading(false);
    setIsReading(true);
    speechSynthesis.speak(utterance);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Blog Post Not Found</h1>
          <p className="text-muted-foreground">The blog post you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="relative">
        {blog.image_url && (
          <div className="relative w-full h-[60vh] overflow-hidden">
            <img
              src={blog.image_url}
              alt={blog.title}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
          </div>
        )}
        
        <div className="container mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
          <article className="max-w-5xl mx-auto relative">
            <div className={cn(
              "space-y-4",
              blog.image_url && "-mt-32 bg-background/95 backdrop-blur-sm rounded-t-xl p-6 md:p-8 lg:p-10 xl:p-12 shadow-lg"
            )}>
              {blog.category && (
                <Badge
                  className="mb-2"
                  style={{
                    backgroundColor: blog.category.color || '#666',
                    color: '#fff',
                  }}
                >
                  {blog.category.name}
                </Badge>
              )}

              <h1 className="text-4xl font-bold">{blog.title}</h1>

              <div className="flex items-center justify-between py-4 border-y">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    {blog.author_avatar_url ? (
                      <AvatarImage src={blog.author_avatar_url} alt={blog.author_name} />
                    ) : (
                      <AvatarFallback>{blog.author_name[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{blog.author_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(blog.created_at), 'MMMM d, yyyy')} · {blog.estimated_read_time} min read
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleTextToSpeech}
                    className="relative"
                  >
                    {isReading ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleBookmark}>
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            
              <div 
                className="prose dark:prose-invert max-w-none mt-8 
                  [&>p]:leading-relaxed [&>p]:mb-6 [&>p]:text-[16px] md:[&>p]:text-lg lg:[&>p]:text-xl 
                  [&>p]:tracking-normal [&>p]:mx-auto [&>p]:max-w-none md:[&>p]:max-w-4xl
                  [&>p]:px-4 md:[&>p]:px-0
                  [&>h2]:text-xl md:[&>h2]:text-2xl lg:[&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mb-4 [&>h2]:mt-8
                  [&>h3]:text-lg md:[&>h3]:text-xl lg:[&>h3]:text-2xl [&>h3]:font-semibold [&>h3]:mb-3 [&>h3]:mt-6
                  [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-6 [&>ul]:space-y-2 [&>ul]:px-4 md:[&>ul]:px-0
                  [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-6 [&>ol]:space-y-2 [&>ol]:px-4 md:[&>ol]:px-0
                  [&>blockquote]:border-l-4 [&>blockquote]:border-primary/20 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:px-4 md:[&>blockquote]:px-0
                  [&>*]:max-w-none md:[&>*]:max-w-4xl [&>*]:mx-auto"
                style={{ fontSize: `${fontSize}%` }}
                ref={contentRef}
                dangerouslySetInnerHTML={{ 
                  __html: blog.content
                    .replace(/\n\n/g, '</p><p class="whitespace-pre-wrap">')
                    .replace(/\n/g, '<br />')
                    .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="w-full max-w-5xl mx-auto rounded-lg my-8 shadow-lg" />')
                    .replace(/^(.+?)(?=<\/p>|$)/gm, '<p class="whitespace-pre-wrap">$1</p>')
                }}
              />
            </div>
          </article>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 space-y-4">
        <ReadingSettings onFontSizeChange={setFontSize} />
        {showBackToTop && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={handleBackToTop}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="mt-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-background rounded-lg shadow-sm p-6 md:p-8">
            <Comments blogId={parseInt(postId)} />
          </div>
        </div>
      </div>
    </div>
  )
} 
