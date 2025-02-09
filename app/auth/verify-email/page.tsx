'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We've sent you a verification link. Please check your email to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Once verified, you can sign in to your account.</p>
            <p className="mt-2">
              Didn't receive the email? Check your spam folder or{' '}
              <Link href="/auth/signup" className="text-primary hover:underline">
                try signing up again
              </Link>
              .
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Return to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 