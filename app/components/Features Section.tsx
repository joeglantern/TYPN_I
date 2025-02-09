import { Users, Calendar, Award, Lightbulb, Globe, Rocket } from 'lucide-react'

const features = [
  {
    icon: <Users size={40} />,
    title: 'Community Forums',
    description: 'Connect with like-minded individuals and share your ideas.'
  },
  {
    icon: <Calendar size={40} />,
    title: 'Global Events',
    description: 'Participate in workshops, webinars, and conferences worldwide.'
  },
  {
    icon: <Award size={40} />,
    title: 'Skill Development',
    description: 'Access resources and courses to enhance your abilities.'
  },
  {
    icon: <Lightbulb size={40} />,
    title: 'Innovative Projects',
    description: 'Collaborate on cutting-edge initiatives that matter.'
  },
  {
    icon: <Globe size={40} />,
    title: 'Cultural Exchange',
    description: 'Broaden your horizons through international connections.'
  },
  {
    icon: <Rocket size={40} />,
    title: 'Leadership Opportunities',
    description: 'Take charge and lead impactful community projects.'
  }
]

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in-up">Why Join TYPNI?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-purple-600 mb-4 animate-bounce-in" style={{ animationDelay: `${index * 100 + 300}ms` }}>{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
