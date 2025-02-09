'use client'

import { Button } from "../../components/ui/button"
import { Globe, Heart, Users, Target } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="container px-4 text-center space-y-8 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-bold">About TYPNI</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        The Young Peoples' Network International
        </p>
      </section>

      {/* Mission Section */}
      <section className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              TYPNI aims to create a global network of young leaders who are passionate about making a positive impact in their communities and beyond. Through collaboration, education, and action, we empower youth to address pressing global challenges.
            </p>
            <Button asChild>
              <Link href="/volunteer">Join Our Mission</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: "Global Reach",
                description: "Connected across continents",
                icon: Globe,
              },
              {
                title: "Community Impact",
                description: "Making real change",
                icon: Heart,
              },
              {
                title: "Youth Leadership",
                description: "Empowering future leaders",
                icon: Users,
              },
              {
                title: "Clear Vision",
                description: "Focused on results",
                icon: Target,
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="p-6 bg-card rounded-lg border animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <item.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Innovation",
              description: "We encourage creative solutions to global challenges.",
            },
            {
              title: "Collaboration",
              description: "We believe in the power of working together across cultures.",
            },
            {
              title: "Impact",
              description: "We focus on creating measurable, positive change.",
            },
            {
              title: "Inclusivity",
              description: "We welcome diverse perspectives and experiences.",
            },
            {
              title: "Leadership",
              description: "We develop tomorrow's global leaders today.",
            },
            {
              title: "Sustainability",
              description: "We promote long-term solutions for lasting impact.",
            },
          ].map((value, index) => (
            <div
              key={value.title}
              className="p-6 bg-card rounded-lg border animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-xl font-bold mb-2">{value.title}</h3>
              <p className="text-muted-foreground">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Location Section */}
      <section className="container px-4 text-center space-y-6">
        <h2 className="text-3xl font-bold">Based in Nairobi, Kenya</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          While our headquarters is in Nairobi, our impact reaches across the globe through our network of volunteers and partners.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/volunteer">Get Involved</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
