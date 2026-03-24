'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  opacity: number
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)

  const colors = [
    'rgba(128, 80, 255,',   // brighter purple
    'rgba(160, 110, 255,',  // lighter purple
    'rgba(60, 225, 200,',   // brighter teal
    'rgba(50, 220, 245,',   // brighter cyan
    'rgba(120, 120, 255,',  // brighter indigo
    'rgba(180, 100, 255,',  // brighter violet
  ]

  const initParticles = useCallback((width: number, height: number) => {
    const count = Math.min(Math.floor((width * height) / 9000), 150)
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.35,
      })
    }
    return particles
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
      particlesRef.current = initParticles(canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY + window.scrollY }
      }
    }

    const handleTouchEnd = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)

    // Periodically resize canvas to match document height
    const resizeInterval = setInterval(() => {
      const docHeight = document.documentElement.scrollHeight
      if (canvas.height !== docHeight) {
        canvas.height = docHeight
      }
    }, 2000)

    // Draw cosmic gradient blobs (static, drawn once per resize)
    let cosmicCanvas: HTMLCanvasElement | null = null
    const drawCosmicBg = () => {
      cosmicCanvas = document.createElement('canvas')
      cosmicCanvas.width = canvas.width
      cosmicCanvas.height = canvas.height
      const cctx = cosmicCanvas.getContext('2d')
      if (!cctx) return

      // Floating cosmic gradients
      const blobs = [
        { x: 0.15, y: 0.1, r: 0.35, color: 'rgba(80, 40, 160, 0.12)' },
        { x: 0.85, y: 0.05, r: 0.3, color: 'rgba(30, 100, 160, 0.10)' },
        { x: 0.5, y: 0.3, r: 0.4, color: 'rgba(60, 30, 120, 0.08)' },
        { x: 0.1, y: 0.55, r: 0.35, color: 'rgba(45, 100, 180, 0.07)' },
        { x: 0.9, y: 0.45, r: 0.3, color: 'rgba(100, 40, 180, 0.09)' },
        { x: 0.4, y: 0.7, r: 0.35, color: 'rgba(40, 150, 160, 0.07)' },
        { x: 0.7, y: 0.85, r: 0.3, color: 'rgba(80, 50, 140, 0.08)' },
        { x: 0.2, y: 0.9, r: 0.25, color: 'rgba(50, 120, 160, 0.06)' },
      ]

      blobs.forEach(b => {
        const grad = cctx.createRadialGradient(
          b.x * canvas.width, b.y * canvas.height, 0,
          b.x * canvas.width, b.y * canvas.height, b.r * Math.max(canvas.width, canvas.height)
        )
        grad.addColorStop(0, b.color)
        grad.addColorStop(1, 'transparent')
        cctx.fillStyle = grad
        cctx.fillRect(0, 0, canvas.width, canvas.height)
      })
    }
    drawCosmicBg()

    const origResize = resize
    const cosmicResize = () => {
      origResize()
      drawCosmicBg()
    }
    window.removeEventListener('resize', resize)
    window.addEventListener('resize', cosmicResize)

    const animate = () => {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw cosmic background
      if (cosmicCanvas) {
        ctx.drawImage(cosmicCanvas, 0, 0)
      }

      const particles = particlesRef.current
      const mouse = mouseRef.current
      const connectionDist = 160
      const mouseDist = 200

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Mouse interaction — attract gently
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < mouseDist && dist > 0) {
          const force = (mouseDist - dist) / mouseDist
          p.vx += (dx / dist) * force * 0.015
          p.vy += (dy / dist) * force * 0.015
          // Glow up near mouse
          p.opacity = Math.min(0.9, p.opacity + 0.02)
        } else {
          p.opacity += (Math.random() * 0.4 + 0.3 - p.opacity) * 0.01
        }

        // Damping
        p.vx *= 0.995
        p.vy *= 0.995

        // Move
        p.x += p.vx
        p.y += p.vy

        // Wrap edges
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color + p.opacity + ')'
        ctx.fill()

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const cdx = p.x - p2.x
          const cdy = p.y - p2.y
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy)

          if (cdist < connectionDist) {
            const alpha = (1 - cdist / connectionDist) * 0.35
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = p.color + alpha + ')'
            ctx.lineWidth = 1.2
            ctx.stroke()
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', cosmicResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      clearInterval(resizeInterval)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [initParticles])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
