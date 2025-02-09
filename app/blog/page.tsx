'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

interface BlogPost {
  id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
  author_name: string
  author_avatar_url: string | null
  category: Category | null
  updated_at: string
}

interface Category {
  id: number
  name: string
  slug: string
  description: string
  color: string
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('blog_categories')
          .select('*')
          .order('name')

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError)
          throw new Error('Failed to fetch categories')
        }

        setCategories(categoriesData || [])

        // Fetch blogs with their categories
        const { data: blogsData, error: blogsError } = await supabase
          .from('blogs')
          .select(`
            id,
            title,
            content,
            image_url,
            created_at,
            updated_at,
            author_name,
            author_avatar_url,
            blog_categories!blogs_category_id_fkey (
              id,
              name,
              slug,
              description,
              color
            )
          `)
          .order('created_at', { ascending: false })

        if (blogsError) {
          console.error('Error fetching blogs:', blogsError)
          throw new Error('Failed to fetch blogs')
        }

        // Transform the data to match our interface
        const transformedBlogs = (blogsData || []).map(blog => ({
          id: blog.id,
          title: blog.title,
          content: blog.content,
          image_url: blog.image_url,
          created_at: blog.created_at,
          updated_at: blog.updated_at,
          author_name: blog.author_name,
          author_avatar_url: blog.author_avatar_url,
          category: Array.isArray(blog.blog_categories) && blog.blog_categories[0] ? {
            id: blog.blog_categories[0].id,
            name: blog.blog_categories[0].name,
            slug: blog.blog_categories[0].slug,
            description: blog.blog_categories[0].description,
            color: blog.blog_categories[0].color
          } : null
        }))

        setBlogs(transformedBlogs)
      } catch (err) {
        console.error('Error in fetchData:', err)
        setError(err instanceof Error ? err.message : 'An error occurred while fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredBlogs = useMemo(() => {
    if (selectedCategory === 'all') return blogs
    return blogs.filter(blog => blog.category?.slug === selectedCategory)
  }, [blogs, selectedCategory])

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      
      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="all" className="whitespace-nowrap">All Categories</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.slug}
              onClick={() => setSelectedCategory(category.slug)}
              className="whitespace-nowrap"
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredBlogs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No blog posts found in this category.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredBlogs.map((blog) => (
            <Card key={blog.id} className="flex flex-col h-full">
              {blog.image_url && blog.image_url.trim() !== '' && (
                <CardHeader className="p-0">
                  <div className="relative w-full pt-[56.25%]">
                    <Image
                      src={blog.image_url}
                      alt={blog.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                </CardHeader>
              )}
              <CardContent className="flex-grow p-4 sm:p-6">
                {blog.category && (
                  <Badge
                    className="mb-2 max-w-full overflow-hidden text-ellipsis"
                    style={{
                      backgroundColor: blog.category.color || '#666',
                      color: '#fff',
                    }}
                  >
                    {blog.category.name}
                  </Badge>
                )}
                <h2 className="text-lg sm:text-xl font-semibold mb-2 line-clamp-2">{blog.title}</h2>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base line-clamp-3">
                  {blog.content.substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between mt-auto flex-wrap gap-2">
                  <div className="flex items-center">
                    {blog.author_avatar_url && blog.author_avatar_url.trim() !== '' ? (
                      <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                        <AvatarImage src={blog.author_avatar_url} alt={blog.author_name} />
                        <AvatarFallback>{blog.author_name[0]}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                        <AvatarFallback>{blog.author_name[0]}</AvatarFallback>
                      </Avatar>
                    )}
                    <span className="text-sm text-muted-foreground truncate max-w-[120px]">{blog.author_name}</span>
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {new Date(blog.created_at).toLocaleDateString()}
                  </time>
                </div>
              </CardContent>
              <CardFooter className="p-4 sm:p-6 pt-0">
                <Button asChild className="w-full">
                  <Link href={`/blog/${blog.id}`}>Read More</Link>
                </Button>
              </CardFooter>
            </Card>
        ))}
      </div>
      )}
    </div>
  )
}
