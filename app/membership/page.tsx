'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const interests = [
  "Youth Empowerment",
  "Youth Mentorship",
  "Youth Employment",
  "Entrepreneurship",
  "Financial Literacy",
  "Youth Representation",
  "Education",
  "Sports, Arts & Talent",
  "Pan Africanism",
  "Technology & Digital Literacy",
  "Menstrual Health",
  "Sexual Education",
  "Female Genital Mutilation",
  "Childhood Marriages",
  "Childhood Pregnancies",
  "Alcohol, Drugs & Substance Abuse",
  "Mental Health Action",
  "Inclusivity of Young PWDs",
  "Cyberbullying",
  "Blood Donation",
  "Climate Change Mitigation",
  "Climate Change Adaptation & Resilience",
  "Nature-Based Solutions",
  "Water Solutions & Management",
  "Smart Agriculture"
]

export default function MembershipPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const toggleInterest = (interest: string) => {
    setSelectedInterests(current =>
      current.includes(interest)
        ? current.filter(i => i !== interest)
        : [...current, interest]
    )
  }

  return (
    <div className="min-h-screen py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">TYPNI Registration</CardTitle>
            <CardDescription className="text-center">
              Join our community and make a difference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name (As per your ID)*</Label>
                  <Input id="fullName" required />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (Start with country code e.g +254 XXXXXXXX)*</Label>
                  <Input id="phone" type="tel" required />
                </div>

                <div>
                  <Label htmlFor="email">What is your email address?*</Label>
                  <Input id="email" type="email" required />
                </div>

                <div>
                  <Label htmlFor="idNumber">ID Number*</Label>
                  <Input id="idNumber" required />
                </div>

                <div>
                  <Label htmlFor="dob">Date of Birth*</Label>
                  <Input id="dob" type="date" required />
                </div>

                <div>
                  <Label>Gender*</Label>
                  <RadioGroup defaultValue="male" className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="country">Country*</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kenya">Kenya</SelectItem>
                      <SelectItem value="uganda">Uganda</SelectItem>
                      <SelectItem value="tanzania">Tanzania</SelectItem>
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="education">What is your highest education level?*</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="degree">Degree</SelectItem>
                      <SelectItem value="masters">Masters</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Are you Employed?*</Label>
                  <RadioGroup defaultValue="no" className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="employed-yes" />
                      <Label htmlFor="employed-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="employed-no" />
                      <Label htmlFor="employed-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-lg font-semibold block mb-4">Let's Pick Your Interests*</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {interests.map((interest) => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox
                          id={interest}
                          checked={selectedInterests.includes(interest)}
                          onCheckedChange={() => toggleInterest(interest)}
                        />
                        <Label htmlFor={interest}>{interest}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">Submit Registration</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 