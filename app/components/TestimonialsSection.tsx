'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Quote } from 'lucide-react'

type Testimonial = {
  id: number
  name: string
  role: string
  company: string
  image: string
  quote: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Youth Leader",
    company: "Community Impact Initiative",
    image: "/testimonials/sarah.jpg",
    quote: "TYPNI has transformed how I approach community service. The global network and resources have helped me make a real difference in my local area."
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Program Participant",
    company: "Digital Skills Program",
    image: "/testimonials/michael.jpg",
    quote: "The digital skills training I received through TYPNI opened up new opportunities for me. The mentorship and hands-on projects were invaluable."
  },
  {
    id: 3,
    name: "Aisha Patel",
    role: "Community Organizer",
    company: "Youth Empowerment Network",
    image: "/testimonials/aisha.jpg",
    quote: "Being part of TYPNI's global community has broadened my perspective and connected me with like-minded changemakers worldwide."
  }
]

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  }

  const swipeConfidenceThreshold = 10000
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity
  }

  const paginate = (newDirection: number) => {
    setDirection(newDirection)
    setCurrentIndex((prev) => (prev + newDirection + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/50">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What Our Community Says</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from the amazing individuals who are part of our global network
          </p>
        </div>

        <div className="relative h-[400px] max-w-4xl mx-auto">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x)

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1)
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1)
                }
              }}
              className="absolute w-full"
            >
              <div className="bg-card rounded-lg p-8 shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden">
                    <Image
                      src={testimonials[currentIndex].image}
                      alt={testimonials[currentIndex].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <Quote className="w-10 h-10 text-primary mb-4 mx-auto md:mx-0" />
                    <blockquote className="text-xl mb-4">
                      {testimonials[currentIndex].quote}
                    </blockquote>
                    <div>
                      <cite className="not-italic font-semibold">
                        {testimonials[currentIndex].name}
                      </cite>
                      <p className="text-muted-foreground">
                        {testimonials[currentIndex].role} at {testimonials[currentIndex].company}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-[-3rem] left-1/2 transform -translate-x-1/2 flex space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1)
                  setCurrentIndex(index)
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 