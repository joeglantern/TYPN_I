'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ClientBoundary } from '@/components/client-boundary'

interface FormData {
  username: string
  email: string
  password: string
}

function SignUpContent() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate form data
      if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
        throw new Error('All fields are required')
      }

      // Check if username already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formData.username.trim())

      if (checkError) {
        throw new Error('Error checking username availability')
      }

      if (existingUsers.length > 0) {
        throw new Error('Username already taken')
      }

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: formData.username.trim()
          }
        }
      })

      if (signUpError) {
        console.error('Signup error:', signUpError)
        throw new Error(signUpError.message || 'Error during signup. Please try again.')
      }

      if (!data?.user) {
        throw new Error('No user data returned')
      }

      // Create profile record with RLS disabled
      const { error: profileError } = await supabase.auth.admin
        .createUser({
          email: formData.email.trim(),
          password: formData.password,
          email_confirm: true,
          user_metadata: {
            username: formData.username.trim()
          }
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error('Error creating user profile')
      }

      toast.success('Account created successfully! Please check your email to verify your account.')
      router.push('/auth/login')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-lg py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Sign up to join our community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <ClientBoundary>
      <SignUpContent />
    </ClientBoundary>
  )
} 