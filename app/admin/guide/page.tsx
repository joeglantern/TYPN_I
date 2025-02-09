'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminGuidePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Guide</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Welcome to the admin guide. This section will help you manage the website effectively.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Managing Content</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the sidebar navigation to access different sections</li>
              <li>You can manage blogs, events, programs, and other content</li>
              <li>Always preview content before publishing</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>View and manage users in the Users section</li>
              <li>Monitor chat and handle reports</li>
              <li>Ban users who violate community guidelines</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 