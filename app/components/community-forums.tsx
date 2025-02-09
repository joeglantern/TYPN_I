import { Users, MessageSquare, Heart, Share2 } from 'lucide-react'
import { FeatureCard } from './feature-card'

export function CommunityForums() {
  const features = [
    {
      icon: Users,
      title: "Connect with Others",
      description: "Join a vibrant community of like-minded individuals and share your experiences."
    },
    {
      icon: MessageSquare,
      title: "Engage in Discussions",
      description: "Participate in meaningful conversations about topics that matter to you."
    },
    {
      icon: Heart,
      title: "Support & Encouragement",
      description: "Give and receive support in a safe and welcoming environment."
    },
    {
      icon: Share2,
      title: "Share Resources",
      description: "Exchange helpful resources and learn from others' experiences."
    }
  ]

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Community Forums</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join our supportive community where you can connect, share, and grow together.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
} 