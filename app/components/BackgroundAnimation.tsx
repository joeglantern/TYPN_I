'use client'

import { useEffect, useRef } from 'react'

const BackgroundAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    const particles: Particle[] = []
    const particleCount = 150
    const colors = ['#FF69B4', '#8A2BE2', '#4B0082', '#00BFFF', '#FFD700']

    class Particle {
      x: number = 0
      y: number = 0
      size: number = 0
      speedX: number = 0
      speedY: number = 0
      color: string = colors[0]

      constructor() {
        if (!canvas) return
        this.initialize()
      }

      initialize() {
        if (!canvas) return
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 8 + 2
        this.speedX = Math.random() * 2 - 1
        this.speedY = Math.random() * 2 - 1
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      update() {
        if (!canvas) return
        this.x += this.speedX
        this.y += this.speedY

        if (this.size > 0.2) this.size -= 0.1

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }

      draw() {
        if (!ctx) return
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }

      connect() {
        if (!ctx) return
        particles.forEach(particle => {
          const distance = Math.sqrt(
            (this.x - particle.x) ** 2 + (this.y - particle.y) ** 2
          )
          if (distance < 100) {
            ctx.beginPath()
            ctx.strokeStyle = this.color
            ctx.lineWidth = 0.2
            ctx.moveTo(this.x, this.y)
            ctx.lineTo(particle.x, particle.y)
            ctx.stroke()
          }
        })
      }
    }

    const init = () => {
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((particle, index) => {
        particle.update()
        particle.draw()
        particle.connect()
        if (particle.size <= 0.2) {
          particles.splice(index, 1)
          particles.push(new Particle())
        }
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    init()
    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]"
    />
  )
}

export default BackgroundAnimation
