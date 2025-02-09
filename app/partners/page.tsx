import { Handshake, Globe, Users, Briefcase, Lightbulb, Award } from 'lucide-react'

const partners = [
  { name: 'Global Education Alliance', logo: '/placeholder.svg?height=100&width=100' },
  { name: 'Tech Innovators Network', logo: '/placeholder.svg?height=100&width=100' },
  { name: 'Sustainable Future Foundation', logo: '/placeholder.svg?height=100&width=100' },
  { name: 'Youth Empowerment Initiative', logo: '/placeholder.svg?height=100&width=100' },
  { name: 'Cultural Bridge International', logo: '/placeholder.svg?height=100&width=100' },
  { name: 'Social Impact Ventures', logo: '/placeholder.svg?height=100&width=100' },
]

export default function PartnersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center animate-fade-in-up">Our Partners</h1>
      <p className="text-lg text-center mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
        We collaborate with organizations worldwide to create meaningful opportunities for youth and drive positive change.
      </p>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
        {partners.map((partner, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            <img src={partner.logo || "/placeholder.svg"} alt={partner.name} className="w-24 h-24 mb-4" />
            <h2 className="text-xl font-bold text-center">{partner.name}</h2>
          </div>
        ))}
      </div>
      <h2 className="text-3xl font-bold mb-8 text-center animate-fade-in-up">Partnership Benefits</h2>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[
          { icon: Handshake, title: 'Collaboration', description: 'Work together on impactful projects and initiatives.' },
          { icon: Globe, title: 'Global Reach', description: 'Extend your influence and connect with youth worldwide.' },
          { icon: Users, title: 'Network Growth', description: 'Engage with a diverse community of young changemakers.' },
          { icon: Briefcase, title: 'Resource Sharing', description: 'Access and contribute to a wealth of knowledge and tools.' },
          { icon: Lightbulb, title: 'Innovation', description: 'Co-create solutions to address pressing global challenges.' },
          { icon: Award, title: 'Recognition', description: 'Gain visibility as a supporter of youth empowerment.' },
        ].map((benefit, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-fade-in-up" style={{ animationDelay: `${(index + 6) * 100}ms` }}>
            <benefit.icon size={48} className="mb-4 text-purple-600" />
            <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
            <p className="text-gray-600">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
