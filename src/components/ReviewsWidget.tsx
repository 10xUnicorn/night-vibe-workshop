'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Review {
  id: string
  name: string
  company?: string
  review: string
  stars: number
  created_at: string
}

export default function ReviewsWidget() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const trackRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const posRef = useRef(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    sb.from('reviews')
      .select('id,name,company,review,stars,created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews(data || [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (reviews.length < 3) return
    const track = trackRef.current
    if (!track) return

    const speed = 0.5 // px per frame
    const totalWidth = track.scrollWidth / 2 // duplicated content

    const animate = () => {
      if (!pausedRef.current) {
        posRef.current += speed
        if (posRef.current >= totalWidth) posRef.current = 0
        if (track) track.style.transform = `translateX(-${posRef.current}px)`
      }
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [reviews])

  if (loading || reviews.length < 3) return null

  const doubled = [...reviews, ...reviews] // infinite loop

  return (
    <section style={{
      padding: '64px 0',
      background: 'linear-gradient(to bottom, var(--bg-dark, #0a0a0a), #0f0a1a)',
      borderTop: '1px solid rgba(139, 92, 246, 0.15)',
      overflow: 'hidden',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 12 }}>
          What Builders Are Saying
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, color: 'white', margin: 0 }}>
          Real Results. Real People.
        </h2>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 4 }}>
          {'⭐⭐⭐⭐⭐'.split('').map((s, i) => (
            <span key={i} style={{ fontSize: 20 }}>{s}</span>
          ))}
        </div>
      </div>

      <div
        style={{ overflow: 'hidden', cursor: 'grab', userSelect: 'none' }}
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
      >
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            gap: 20,
            width: 'max-content',
            padding: '8px 0',
            willChange: 'transform',
          }}
        >
          {doubled.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              style={{
                width: 320,
                flexShrink: 0,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 16,
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Stars */}
              <div style={{ fontSize: 16 }}>
                {'⭐'.repeat(r.stars)}
              </div>

              {/* Review text */}
              <p style={{
                fontSize: 14,
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.85)',
                margin: 0,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                &ldquo;{r.review}&rdquo;
              </p>

              {/* Author */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>{r.name}</div>
                {r.company && (
                  <div style={{ fontSize: 12, color: '#a78bfa', marginTop: 2 }}>{r.company}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <a
          href="/workshop-review"
          style={{
            display: 'inline-block',
            padding: '12px 28px',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: 8,
            color: '#a78bfa',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(139,92,246,0.15)' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent' }}
        >
          Leave a Review →
        </a>
      </div>
    </section>
  )
}
