'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { format, formatDistanceToNow } from 'date-fns'
import { MoreHorizontal, Edit2, Trash2, MessageSquare, Heart, HeartOff, Pencil, Smile } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import EmojiPicker from 'emoji-picker-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Comment {
  id: number
  content: string
  created_at: string
  updated_at: string
  author_name: string
  author_avatar_url: string | null
  user_id: string
  is_edited: boolean
  parent_id: number | null
  replies?: Comment[]
  likes: number
  liked_by_user: boolean
  profile?: {
    username: string
    full_name: string
    avatar_url: string
  }
}

interface DatabaseComment {
  id: number
  content: string
  created_at: string
  updated_at: string
  user_id: string
  parent_id: number | null
  is_edited: boolean
  author_name: string | null
  author_avatar_url: string | null
  likes: { user_id: string }[]
  user_profile: {
    full_name: string
    avatar_url: string
  } | null
}

interface CommentsProps {
  blogId: number
}

export function Comments({ blogId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUserProfile(profile)
      }
    }

    getSession()
    fetchComments()
  }, [blogId])

  const fetchComments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Use the new get_blog_comments function
      const { data: commentsData, error: commentsError } = await supabase
        .rpc('get_blog_comments', { p_blog_id: blogId })

      if (commentsError) {
        console.error('Error fetching comments:', commentsError.message)
        setComments([])
        return
      }

      // Handle case where there are no comments yet
      if (!commentsData || commentsData.length === 0) {
        setComments([])
        return
      }

      // Transform the data to include like information and profile data
      const transformedData: Comment[] = (commentsData as DatabaseComment[]).map((comment: DatabaseComment) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user_id: comment.user_id,
        parent_id: comment.parent_id,
        is_edited: comment.is_edited,
        author_name: comment.author_name || comment.user_profile?.full_name || 'Unknown',
        author_avatar_url: comment.author_avatar_url || comment.user_profile?.avatar_url || null,
        likes: comment.likes?.length || 0,
        liked_by_user: session ? comment.likes?.some((like) => like.user_id === session.user.id) : false,
        profile: comment.user_profile ? {
          username: comment.user_profile.full_name, // Using full_name as username since it's not in the database
          full_name: comment.user_profile.full_name,
          avatar_url: comment.user_profile.avatar_url
        } : undefined,
        replies: []
      }))

      // Organize comments into threads
      const threads = transformedData.reduce((acc: Comment[], comment) => {
        if (!comment.parent_id) {
          const commentWithReplies = {
            ...comment,
            replies: transformedData.filter(reply => reply.parent_id === comment.id)
          }
          acc.push(commentWithReplies)
        }
        return acc
      }, [])

      setComments(threads)
    } catch (error: any) {
      console.error('Error in fetchComments:', error.message)
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (commentId: number, isLiked: boolean) => {
    if (!session) {
      toast.error('Please sign in to like comments')
      return
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('blog_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', session.user.id)

        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('blog_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: session.user.id
          })

        if (error) throw error
      }

      fetchComments()
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    }
  }

  const handleEmojiSelect = (emoji: any, textSetter: (text: string) => void, currentText: string) => {
    const emojiChar = emoji.emoji
    textSetter(currentText + emojiChar)
  }

  const EmojiPickerButton = ({ onEmojiSelect }: { onEmojiSelect: (emoji: any) => void }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <EmojiPicker
          onEmojiClick={onEmojiSelect}
          width="100%"
          height="350px"
        />
      </PopoverContent>
    </Popover>
  )

  const handleSubmit = async (e: React.FormEvent | null, parentId: number | null = null) => {
    if (e) {
      e.preventDefault()
    }

    if (!session) {
      toast.error('Please sign in to comment')
      return
    }

    const content = editingComment ? editContent : newComment
    if (!content.trim()) {
      toast.error('Comment cannot be empty')
      return
    }

    try {
      if (editingComment) {
        // Update existing comment
        const { data, error } = await supabase.rpc('update_comment', {
          p_comment_id: editingComment,
          p_content: content
        })

        if (error) throw error
        toast.success('Comment updated')
        setEditingComment(null)
        setEditContent('')
      } else {
        // Create new comment
        const { error } = await supabase
          .from('blog_comments')
          .insert({
            blog_id: blogId,
            content,
            user_id: session.user.id,
            parent_id: parentId,
            author_name: userProfile?.full_name || session.user.user_metadata.full_name || session.user.email,
            author_avatar_url: userProfile?.avatar_url || session.user.user_metadata.avatar_url
          })

        if (error) throw error
        toast.success(parentId ? 'Reply posted' : 'Comment posted')
        setNewComment('')
        setReplyTo(null)
      }

      fetchComments()
    } catch (error) {
      console.error('Error saving comment:', error)
      toast.error('Failed to save comment')
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!session) return

    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', session.user.id)

      if (error) throw error
      toast.success('Comment deleted')
      fetchComments()
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const renderComment = (comment: Comment, level: number = 0) => {
    return (
      <div key={comment.id} className={`relative ${level > 0 ? 'ml-8 mt-4' : 'mt-6'}`}>
        {level > 0 && (
          <div className="absolute left-[-24px] top-[24px] bottom-0 w-[2px] bg-border" />
        )}
        <div className="flex items-start gap-4 relative">
          <Avatar className="h-8 w-8">
            {comment.author_avatar_url ? (
              <AvatarImage src={comment.author_avatar_url} alt={comment.author_name} />
            ) : (
              <AvatarFallback>{comment.author_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.author_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
            </div>
            {editingComment === comment.id ? (
              <div className="space-y-2">
                <div className="relative">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[100px] pr-10"
                  />
                  <div className="absolute bottom-2 right-2">
                    <EmojiPickerButton
                      onEmojiSelect={(emoji) => handleEmojiSelect(emoji, setEditContent, editContent)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(null)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{comment.content}</p>
            )}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleLike(comment.id, comment.liked_by_user)}
              >
                {comment.liked_by_user ? (
                  <HeartOff className="h-4 w-4 mr-1 text-primary" />
                ) : (
                  <Heart className="h-4 w-4 mr-1" />
                )}
                {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
              </Button>
              {session && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setReplyTo(comment.id)
                      setNewComment('')
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                  {session.user.id === comment.user_id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setEditingComment(comment.id)
                          setEditContent(comment.content)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        {replyTo === comment.id && (
          <div className="ml-12 mt-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8">
                {userProfile?.avatar_url ? (
                  <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name} />
                ) : (
                  <AvatarFallback>
                    {userProfile?.full_name?.slice(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="relative">
                  <Textarea
                    id="reply-input"
                    placeholder={`Reply to ${comment.author_name}...`}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full min-h-[100px] pr-10"
                    autoFocus
                  />
                  <div className="absolute bottom-2 right-2">
                    <EmojiPickerButton
                      onEmojiSelect={(emoji) => handleEmojiSelect(emoji, setNewComment, newComment)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSubmit(null, comment.id)}
                    disabled={!newComment.trim()}
                  >
                    Post Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyTo(null)
                      setNewComment('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        {comment.replies?.map(reply => renderComment(reply, level + 1))}
      </div>
    )
  }

  if (loading) {
    return <div className="animate-pulse">Loading comments...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments</h2>
      {session ? (
        <div className="flex items-start gap-4">
          <Avatar className="h-8 w-8">
            {userProfile?.avatar_url ? (
              <AvatarImage src={userProfile.avatar_url} alt={userProfile.full_name} />
            ) : (
              <AvatarFallback>
                {userProfile?.full_name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="relative">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full min-h-[100px] pr-10"
              />
              <div className="absolute bottom-2 right-2">
                <EmojiPickerButton
                  onEmojiSelect={(emoji) => handleEmojiSelect(emoji, setNewComment, newComment)}
                />
              </div>
            </div>
            <Button
              onClick={() => handleSubmit(null)}
              disabled={!newComment.trim()}
            >
              Comment
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-muted rounded-lg">
          <p>Please <Link href="/login" className="text-primary hover:underline">sign in</Link> to comment</p>
        </div>
      )}
      
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  )
} 
