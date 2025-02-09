'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { GallerySelect } from "@/components/ui/gallery-select"
import { supabase } from '@/lib/supabase'
import { Loader2, Plus, Pencil, Trash } from "lucide-react"
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Blog {
  id: number
  title: string
  content: string
  author_name: string
  author_avatar_url: string | null
  image_id: number
  image_url: string
  category: string
  created_at: string
  updated_at: string | null
  published: boolean
}

interface GalleryImage {
  id: number
  title: string
  description: string
  image_url: string
  category: string
}

interface Category {
  id: number
  name: string
  slug: string
  color: string
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: '',
    author_avatar_url: null as string | null,
    image_id: null as number | null,
    image_url: '',
    category: '',
    published: true
  })

  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }
      setSession(session)

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/')
        toast.error('Only administrators can create blog posts')
      }
    }

    checkAuth()
    fetchBlogs()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterBlogs()
  }, [searchQuery, selectedCategory, blogs])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const filterBlogs = () => {
    let filtered = [...blogs]
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(blog => 
        blog.title.toLowerCase().includes(query) ||
        blog.content.toLowerCase().includes(query) ||
        blog.author_name.toLowerCase().includes(query)
      )
    }
    
    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(blog => blog.category === selectedCategory)
    }
    
    setFilteredBlogs(filtered)
  }

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBlogs(data || [])
    } catch (error: any) {
      console.error('Error fetching blogs:', error.message)
      toast.error('Failed to fetch blogs')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isAvatar: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        // Create a local preview URL immediately
        const previewUrl = URL.createObjectURL(file);
        if (isAvatar) {
          setFormData(prev => ({
            ...prev,
            author_avatar_url: previewUrl
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            image_url: previewUrl
          }));
        }

        const bucketName = isAvatar ? 'avatars' : 'blogs';
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError, data } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (isAvatar) {
          setFormData(prev => ({
            ...prev,
            author_avatar_url: publicUrl
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            image_url: publicUrl
          }));
        }

        toast.success('Image uploaded successfully');
      } catch (error: any) {
        console.error('Error uploading image:', error.message);
        toast.error(error.message || 'Failed to upload image');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInlineImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Get the textarea element first
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) {
      toast.error('Please wait for the form to load completely');
      return;
    }

    try {
      setLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('blogs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('blogs')
        .getPublicUrl(filePath);

      // Get the current cursor position or use the end of content
      const cursorPos = textarea.selectionStart ?? formData.content.length;
      const textBefore = formData.content.substring(0, cursorPos);
      const textAfter = formData.content.substring(cursorPos);
      
      const imageMarkdown = `\n![${file.name}](${publicUrl})\n`;
      
      const newContent = textBefore + imageMarkdown + textAfter;
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));

      // Set focus back to textarea and update cursor position
      textarea.focus();
      const newCursorPos = cursorPos + imageMarkdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);

      toast.success('Image inserted successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error.message);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.content || !formData.author_name) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (!selectedCategory) {
      toast.error('Please select a category')
      return
    }

    try {
      setLoading(true)
      
      // First, insert the blog post
      const { data: blogData, error: blogError } = await supabase
        .from('blogs')
        .insert({
        title: formData.title,
        content: formData.content,
          image_url: formData.image_url,
        author_name: formData.author_name,
          author_avatar_url: formData.author_avatar_url,
          category_id: selectedCategory
        })
        .select()
        .single()

      if (blogError) throw blogError

      toast.success('Blog post created successfully!')
      setShowDialog(false) // Close the dialog after successful submission
      fetchBlogs() // Refresh the blog list
      
      // Reset form data
      setFormData({
        title: '',
        content: '',
        author_name: '',
        author_avatar_url: null,
        image_id: null,
        image_url: '',
        category: '',
        published: true
      })
      setSelectedCategory(undefined)
      
    } catch (error: any) {
      console.error('Error saving blog:', error)
      toast.error(error.message || 'Failed to save blog post')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog)
    setFormData({
      title: blog.title,
      content: blog.content,
      author_name: blog.author_name,
      author_avatar_url: blog.author_avatar_url,
      image_id: blog.image_id,
      image_url: blog.image_url,
      category: blog.category,
      published: blog.published
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: number) => {
    try {
      setLoading(true)
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Blog deleted successfully');
      fetchBlogs()
    } catch (error) {
      console.error('Error deleting blog:', error)
      toast.error('Failed to delete blog')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (newCategory: string) => {
    if (!newCategory.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_categories')
        .insert([{ 
          name: newCategory.trim() 
        }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('This category already exists');
        }
        throw error;
      }
      
      await fetchCategories();
      toast.success('Category added successfully');
    } catch (error: any) {
      console.error('Error adding category:', error.message);
      toast.error(error.message || 'Failed to add category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Manage Blogs</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage blog posts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingBlog(null)
                setFormData({
                  title: '',
                  content: '',
                  author_name: '',
                  author_avatar_url: null,
                  image_id: null,
                  image_url: '',
                  category: '',
                  published: true
                })
                setSelectedCategory(undefined)
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Blog
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBlog ? 'Edit' : 'Add'} Blog</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter blog title"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="author_name">Author Name *</Label>
                    <Input
                      id="author_name"
                      value={formData.author_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                      placeholder="Enter author name"
                      required
                    />
                  </div>
                  <div>
                    <Label>Author Avatar</Label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        {formData.author_avatar_url && (
                          <div className="relative w-12 h-12 rounded-full overflow-hidden">
                            <Image
                              src={formData.author_avatar_url}
                              alt="Author avatar"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        <Button 
                          type="button"
                          variant="outline" 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>, true);
                            input.click();
                          }}
                        >
                          {formData.author_avatar_url ? 'Change Avatar' : 'Upload Avatar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Featured Image *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="w-full flex flex-col items-center justify-center">
                        <Button 
                          type="button"
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
                            input.click();
                          }}
                        >
                          Choose Featured Image
                        </Button>
                      </label>
                    </div>
                    {formData.image_url && (
                      <div className="relative aspect-video rounded-lg overflow-hidden border">
                        <Image
                          src={formData.image_url}
                          alt="Featured image"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="content">Content *</Label>
                  <div className="space-y-2">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => handleInlineImageSelect(e as unknown as React.ChangeEvent<HTMLInputElement>);
                        input.click();
                      }}
                    >
                      Insert Image
                    </Button>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your blog content here. You can insert images using the button above."
                      rows={15}
                      className="font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label>Category *</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedCategory}
                        onValueChange={(value) => setSelectedCategory(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Category Name</Label>
                              <Input
                                id="newCategory"
                                placeholder="Enter category name"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.target as HTMLInputElement;
                                    handleAddCategory(input.value);
                                    input.value = '';
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="published"
                    checked={formData.published}
                    onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="published">Published</Label>
                </div>
                <Button 
                  type="submit"
                  disabled={!formData.title || !formData.content || !formData.author_name || loading} 
                  className="w-full"
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingBlog ? 'Update' : 'Create'} Blog
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.map((blog) => (
          <div
            key={blog.id}
            className={cn(
              "border rounded-lg overflow-hidden",
              !blog.published && "opacity-50"
            )}
          >
            <div className="relative aspect-video">
              <Image
                src={blog.image_url}
                alt={blog.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{blog.title}</h3>
                <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                  {blog.category}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {blog.author_avatar_url && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={blog.author_avatar_url}
                      alt={blog.author_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">By {blog.author_name}</p>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {blog.content}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {new Date(blog.created_at).toLocaleDateString()}
                </span>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(blog)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(blog.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 