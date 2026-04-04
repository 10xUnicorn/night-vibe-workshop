'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import ParticleBackground from '@/components/ParticleBackground'
import RevenueCalculator from '@/components/RevenueCalculator'
import SocialProofPopup from '@/components/SocialProofPopup'
import { renderRichText } from '@/lib/richText'
import { getLandingContent, type LandingPageContent } from '@/lib/landingPageDefaults'

interface HostData {
  id: string
  name: string
  title: string
  company: string
  short_description: string
  bio: string
  headshot_url: string
  category: string
  stat1_value?: string
  stat1_label?: string
  stat2_value?: string
  stat2_label?: string
  stat3_value?: string
  stat3_label?: string
}

interface EventHostData {
  host_id: string
  role: string
  display_order: number
  hosts: HostData
}

interface EventData {
  id: string
  title: string
  slug: string
  subtitle: string
  start_date: string
  end_date: string
  timezone: string
  capacity: number
  status: string
  stripe_payment_link: string
  landing_page_data: Partial<LandingPageContent> & {
    hero_headlines?: string[]
    special_offer?: string
    software_budget?: string
    instructor_name?: string
    company_name?: string
    company_tagline?: string
  }
  event_tickets: {
    id: string
    sold_count: number
    capacity: number
    price: number
    status: string
  }[]
  event_hosts: EventHostData[]
  event_offer_items: { offer_item_id: string; display_order: number; offer_items: { id: string; icon: string; title: string; description: string; glow: string; is_bonus: boolean; display_order: number; featured_image_url?: string; bonus_description?: string; bonus_tags?: string[] } }[]
}

export default function LandingPage() {
  const [event, setEvent] = useState<EventData | null>(null)
  const [seatsLeft, setSeatsLeft] = useState<number>(20)
  const [isSoldOut, setIsSoldOut] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', phone: '', company: '' })
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([])
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const [eventHosts, setEventHosts] = useState<EventHostData[]>([])
  const [offerItems, setOfferItems] = useState<{ icon: string; title: string; description: string; glow: string; is_bonus: boolean; featured_image_url?: string; bonus_description?: string; bonus_tags?: string[] }[]>([])
  const [guarantees, setGuarantees] = useState<{ id: string; title: string; description: string; icon: string; badge_text: string; fine_print: string }[]>([])
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [contactSubmitting, setContactSubmitting] = useState(false)

  const fetchEvent = useCallback(async () => {
    // AUTO-FEATURED: Get the next upcoming published event (no manual is_featured needed)
    const now = new Date().toISOString()
    const { data } = await supabase
      .from('events')
      .select('*, event_tickets(*), event_hosts(*, hosts(*)), event_offer_items(*, offer_items(*))')
      .in('status', ['published', 'sold_out'])
      .eq('is_public', true)
      .gte('end_date', now)
      .order('start_date', { ascending: true })
      .limit(1)
      .single()

    if (data) {
      setEvent(data as EventData)
      const ticket = (data as EventData).event_tickets?.[0]
      if (ticket) {
        const remaining = ticket.capacity - ticket.sold_count
        setSeatsLeft(Math.max(0, remaining))
        setIsSoldOut(remaining <= 0 || data.status === 'sold_out')
      }
      if ((data as EventData).event_hosts) {
        const sorted = [...(data as EventData).event_hosts].sort((a, b) => a.display_order - b.display_order)
        setEventHosts(sorted)
      }
      if ((data as EventData).event_offer_items) {
        const sortedOffers = [...(data as EventData).event_offer_items]
          .sort((a, b) => a.display_order - b.display_order)
          .map(eoi => eoi.offer_items)
          .filter(Boolean)
        setOfferItems(sortedOffers)
      }

      const { data: egData } = await supabase
        .from('event_guarantees')
        .select('guarantee_id, guarantees(*)')
        .eq('event_id', (data as EventData).id)
        .order('display_order')
      if (egData) {
        setGuarantees(egData.map((eg: any) => eg.guarantees).filter(Boolean))
      }
    }

    const { data: upcoming } = await supabase
      .from('events')
      .select('*, event_tickets(*)')
      .in('status', ['published', 'sold_out'])
      .eq('is_public', true)
      .gte('start_date', now)
      .order('start_date', { ascending: true })

    if (upcoming) setUpcomingEvents(upcoming as EventData[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchEvent()
    const interval = setInterval(fetchEvent, 30000)
    return () => clearInterval(interval)
  }, [fetchEvent])

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 600)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: event.id,
        name: waitlistForm.name,
        email: waitlistForm.email,
        phone: waitlistForm.phone || null,
        company: waitlistForm.company || null,
      }),
    })
    setWaitlistSubmitted(true)
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return
    setContactSubmitting(true)
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...contactForm, event_id: event.id }),
    })
    setContactSubmitted(true)
    setContactSubmitting(false)
  }

  const handleCheckout = async () => {
    if (!event) return
    setCheckoutLoading(true)
    try {
      const ticket = event.event_tickets?.[0]
      if (!ticket) return
      const params = new URLSearchParams(window.location.search)
      const ref = params.get('ref') || undefined
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, ticket_id: ticket.id, ref_code: ref }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    }
    setCheckoutLoading(false)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    const els = document.querySelectorAll('.fade-in-section, .stagger-children, .fade-scale, .tech-grid-bg')
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [loading])

  const price = event?.event_tickets?.[0]?.price || 997

  // Get merged content: event overrides + defaults
  const content = getLandingContent(event?.landing_page_data)

  const WaveDivider = ({ flip, variant = 'purple' }: { flip?: boolean; variant?: 'purple' | 'teal' | 'mixed' }) => {
    const colors = {
      purple: { start: 'rgba(108,58,237,0.15)', mid: 'rgba(108,58,237,0.08)', end: 'rgba(108,58,237,0.03)' },
      teal: { start: 'rgba(45,212,191,0.12)', mid: 'rgba(45,212,191,0.06)', end: 'rgba(45,212,191,0.02)' },
      mixed: { start: 'rgba(108,58,237,0.12)', mid: 'rgba(45,212,191,0.08)', end: 'rgba(108,58,237,0.03)' },
    }
    const c = colors[variant]
    return (
      <div className={`wave-divider${flip ? ' flip' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`wg-${variant}-${flip ? 'f' : 'n'}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c.end} />
              <stop offset="50%" stopColor={c.start} />
              <stop offset="100%" stopColor={c.end} />
            </linearGradient>
          </defs>
          <path d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,20 1440,30 L1440,60 L0,60 Z" fill={`url(#wg-${variant}-${flip ? 'f' : 'n'})`} />
          <path d="M0,40 C480,10 960,50 1440,25 L1440,60 L0,60 Z" fill={c.mid} opacity="0.5" />
        </svg>
      </div>
    )
  }

  const GlowDivider = ({ type = 'line' }: { type?: 'line' | 'orb' | 'scan' }) => (
    <div className={type === 'orb' ? 'section-divider-orb' : type === 'scan' ? 'scan-line' : 'section-divider'} aria-hidden="true" />
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const CtaButton = ({ label, style: s }: { label?: string; style?: React.CSSProperties }) => (
    isSoldOut ? (
      <button className="btn-accent" style={s} onClick={() => setShowWaitlist(true)}>{label || 'Join the Waitlist'}</button>
    ) : (
      <button className="btn-accent" style={s} onClick={handleCheckout} disabled={checkoutLoading}>
        {checkoutLoading ? 'Loading...' : (label || 'Reserve Your Seat')}
      </button>
    )
  )

  return (
    <div style={{ position: 'relative' }}>
      <ParticleBackground />
      <SocialProofPopup />

      {/* URGENCY BANNER */}
      <div className="urgency-banner">
        <span style={{ marginRight: 8 }}>&#9679;</span>
        LIVE Workshop — {event ? `${new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : 'Coming Soon'} — Only {seatsLeft} of {event?.capacity || 20} seats remain
      </div>

      {/* ===== HERO ===== */}
      <section style={{ padding: '24px 16px 0', textAlign: 'center', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 0, letterSpacing: '-0.03em' }} className="gradient-text">
          {event?.title || 'Build & Launch Your Profitable App Using Claude & Top AI Tools'}
        </h1>
      </section>

      {/* ===== VIDEO ===== */}
      {content.video_url && (
        <section style={{ padding: '20px 16px 0', maxWidth: 820, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120%', height: '120%', background: 'radial-gradient(ellipse at center, rgba(108,58,237,0.15) 0%, rgba(45,212,191,0.05) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 16, border: '2px solid rgba(108,58,237,0.4)', boxShadow: '0 0 60px rgba(108,58,237,0.2), 0 0 120px rgba(108,58,237,0.08)', zIndex: 1 }}>
              <iframe
                src={content.video_url}
                title={content.video_title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </section>
      )}

      {/* ===== INFO + CTA ===== */}
      <section style={{ padding: '16px 16px 0', textAlign: 'center', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: 'var(--text-secondary)', maxWidth: 680, margin: '0 auto 14px', lineHeight: 1.55 }}>
          {event?.subtitle || 'In this live 2-day workshop, you will turn a real business problem into a working AI app that saves time or generates revenue — even if you are not a developer.'}
        </p>

        <p style={{ marginBottom: 10, fontSize: 'clamp(12px, 2.5vw, 15px)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          &#128197; {event ? `${new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'TBD'}{' · '}&#128336; {event ? `${new Date(event.start_date).toLocaleTimeString('en-US', { hour: 'numeric', timeZone: event.timezone })}–${new Date(event.end_date).toLocaleTimeString('en-US', { hour: 'numeric', timeZone: event.timezone })} ${event.timezone === 'America/Los_Angeles' ? 'PT' : event.timezone === 'America/New_York' ? 'ET' : event.timezone === 'America/Chicago' ? 'CT' : 'MT'}` : '9 AM–1 PM PT'}{' · '}&#128187; Virtual
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 16, paddingBottom: 48 }}>
          <CtaButton />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', padding: '10px 20px', borderRadius: 8, boxShadow: '0 0 20px rgba(239,68,68,0.2), 0 0 40px rgba(239,68,68,0.1)', animation: 'urgency-glow 2s ease-in-out infinite' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 2s infinite', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 'clamp(13px, 2.5vw, 15px)', color: '#EF4444', whiteSpace: 'nowrap' }}>
              {isSoldOut ? 'SOLD OUT' : `Only ${seatsLeft} of ${event?.capacity || 20} seats left!`}
            </span>
          </div>
        </div>
      </section>

      {/* TRANSITION: → Problem */}
      <WaveDivider variant="purple" />

      {/* ===== THE PROBLEM ===== */}
      <section className="section-dark tech-grid-bg">
        <div className="section fade-in-section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.problem_section.label}</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 36, lineHeight: 1.2 }}>
            {content.problem_section.title}<br />
            <span style={{ color: 'var(--text-secondary)' }}>{content.problem_section.subtitle}</span>
          </h2>

          <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {content.problem_section.items.map((item, i) => (
              <div key={i} className={`card card-glow-${item.glow}`} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 36, fontSize: 18, fontWeight: 600, color: 'var(--warning)' }}>
            {content.problem_section.bottom_text}
          </p>
        </div>
      </section>

      {/* TRANSITION: Problem → Transformation */}
      <GlowDivider type="orb" />

      {/* ===== TRANSFORMATION ===== */}
      <section className="section fade-in-section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.transformation_section.label}</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>
          {content.transformation_section.title}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, textAlign: 'left' }}>Before the workshop</h3>
            {content.transformation_section.before_items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 15, color: 'var(--text-secondary)', textAlign: 'left' }}>
                <span style={{ color: '#EF4444', flexShrink: 0 }}>&#10006;</span>{item}
              </div>
            ))}
          </div>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, textAlign: 'left' }}>After the workshop</h3>
            {content.transformation_section.after_items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 15, color: 'var(--text-secondary)', textAlign: 'left' }}>
                <span style={{ color: '#10B981', flexShrink: 0 }}>&#10004;</span>{item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 40 }}><CtaButton /></div>
      </section>

      {/* TRANSITION: Transformation → Why Different */}
      <WaveDivider variant="teal" />

      {/* ===== WHY THIS IS DIFFERENT ===== */}
      <section className="section-dark">
        <div className="section fade-in-section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.comparison_section.label}</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>{content.comparison_section.title}</h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650, margin: '0 auto 40px' }}>{content.comparison_section.subtitle}</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="comparison-table">
              <thead>
                <tr style={{ background: 'rgba(108,58,237,0.04)' }}>
                  <th style={{ width: '40%' }}>Feature</th>
                  <th>Typical AI Course</th>
                  <th style={{ color: 'var(--accent-light)' }}>This Workshop</th>
                </tr>
              </thead>
              <tbody>
                {content.comparison_section.rows.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>{row.feature}</td>
                    <td style={{ color: 'var(--text-muted)', textAlign: 'left' }}>{row.typical}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 500, textAlign: 'left' }}>{row.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TRANSITION: Why Different → What You Build */}
      <GlowDivider type="scan" />

      {/* ===== WHAT YOU WILL BUILD ===== */}
      <section className="section fade-in-section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.build_section.label}</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>{content.build_section.title}</h2>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650, margin: '0 auto 40px' }}>{content.build_section.subtitle}</p>

        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {content.build_section.items.map((item, i) => (
            <div key={i} className={`card card-glow-${item.glow}`} style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</h3>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 36 }}>
          <div className="seat-counter" style={{ marginBottom: 20 }}><span className="seat-dot" />{seatsLeft} seats remaining</div><br />
          <CtaButton label="Reserve Your Seat" />
        </div>
      </section>

      {/* TRANSITION: What You Build → Roadmap */}
      <WaveDivider variant="mixed" />

      {/* ===== ANIMATED ROADMAP ===== */}
      <section className="section-dark tech-grid-bg">
        <div className="section fade-in-section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.roadmap_section.label}</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>{content.roadmap_section.title}</h2>

          <div className="roadmap">
            {content.roadmap_section.steps.map((step, i) => (
              <div key={i} className="roadmap-step">
                {i < content.roadmap_section.steps.length - 1 && <div className="roadmap-line" />}
                <div className={`roadmap-dot ${i === 2 ? 'active' : ''}`} style={{ background: `${step.color}20`, border: `2px solid ${step.color}`, color: step.color }}>
                  <span>{step.icon}</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: step.color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Step {step.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRANSITION: Roadmap → Revenue */}
      <GlowDivider type="orb" />

      {/* ===== REVENUE CALCULATOR ===== */}
      {content.show_calculator && (
        <section className="section fade-in-section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.calculator_section.label}</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>{content.calculator_section.title}</h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>{content.calculator_section.subtitle}</p>
          <RevenueCalculator workshopPrice={price} ctaUrl="#" isSoldOut={isSoldOut} onWaitlist={() => setShowWaitlist(true)} />
        </section>
      )}

      {/* TRANSITION: Revenue → Tool Stack */}
      <WaveDivider variant="purple" />

      {/* ===== TOOL STACK ===== */}
      <section className="section-dark">
        <div className="section fade-in-section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.tools_section.label}</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>{content.tools_section.title}</h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 650, margin: '0 auto 48px' }}>{content.tools_section.subtitle}</p>

          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--success)', marginBottom: 20 }}>Required</p>
          <div className="tool-row" style={{ marginBottom: 40 }}>
            {content.tools_section.required.map((tool, i) => (
              <div key={i} className="tool-item">
                <div className="tool-icon">{tool.emoji}</div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{tool.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: tool.cost === 'Free' ? 'var(--success)' : 'var(--accent-light)' }}>{tool.cost}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tool.desc}</span>
              </div>
            ))}
          </div>

          {content.tools_section.optional.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 20 }}>Optional (recommended)</p>
              <div className="tool-row" style={{ marginBottom: 32 }}>
                {content.tools_section.optional.map((tool, i) => (
                  <div key={i} className="tool-item" style={{ opacity: 0.75 }}>
                    <div className="tool-icon">{tool.emoji}</div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{tool.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: tool.cost === 'Free' ? 'var(--success)' : 'var(--accent-light)' }}>{tool.cost}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tool.desc}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 550, margin: '0 auto' }}>{content.tools_section.budget_text}</p>
        </div>
      </section>

      {/* TRANSITION: Tool Stack → Offer */}
      <GlowDivider type="scan" />

      {/* ===== OFFER STACK ===== */}
      <section className="section fade-in-section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Everything included</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>This is not just a workshop. It is a full implementation package.</h2>

        <div className="stagger-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {(offerItems.length > 0 ? offerItems.filter(oi => !oi.is_bonus).map(oi => ({ icon: oi.icon, title: oi.title, desc: oi.description, glow: oi.glow })) : [
            { icon: '🎬', title: 'Live 2-Day Build Sprint', desc: '8 hours of guided, hands-on building. Not lectures — execution.', glow: 'purple' },
            { icon: '💻', title: 'Your Functional App', desc: 'Walk away with a real, deployed application. Not a mockup — a live app.', glow: 'teal' },
            { icon: '🎥', title: 'Full Recording Access', desc: 'Every session recorded. Revisit any step anytime you build your next app.', glow: 'purple' },
            { icon: '📝', title: 'Complete SOPs & Procedures', desc: 'Step-by-step documentation for every technique. Your permanent reference.', glow: 'teal' },
            { icon: '📚', title: 'The 3-Step AI App Blueprint', desc: 'Our proprietary framework from business problem to working app.', glow: 'purple' },
            { icon: '👥', title: 'Community Access', desc: 'Join builders who share resources, ask questions, and grow together.', glow: 'teal' },
            { icon: '🔄', title: '3 Bonus Future Sessions', desc: 'Access to 3 additional workshop sessions. Build more apps, keep growing.', glow: 'purple' },
            { icon: '⭐', title: '20-Person Q&A', desc: 'Small cohort = personal attention. Your questions answered in real time.', glow: 'teal' },
          ]).map((item, i) => (
            <div key={i} className={`card card-glow-${item.glow}`} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BONUS ITEMS */}
        {offerItems.filter(oi => oi.is_bonus).map((bonusItem, bi) => (
          <div key={bi} className="bonus-card" style={{ marginTop: 40, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, background: 'rgba(245,197,66,0.1)', padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(245,197,66,0.3)' }}>&#127873; Exclusive Bonus</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: bonusItem.featured_image_url ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr', gap: 32, alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>{bonusItem.title}</h3>
                {(bonusItem.bonus_description || bonusItem.description).split('\n\n').map((para, pi) => (
                  <p key={pi} style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>{para}</p>
                ))}
                <p style={{ fontSize: 14, color: 'var(--gold)', fontWeight: 600, marginBottom: 20 }}>Workshop attendees get FREE early access — this will be a paid standalone app.</p>
                {bonusItem.bonus_tags && bonusItem.bonus_tags.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {bonusItem.bonus_tags.map((tag, ti) => (
                      <span key={ti} style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: ti === bonusItem.bonus_tags!.length - 1 ? 'var(--gold)' : 'var(--accent-light)', background: ti === bonusItem.bonus_tags!.length - 1 ? 'rgba(245,197,66,0.08)' : 'rgba(108,58,237,0.08)', padding: '8px 14px', borderRadius: 100, border: `1px solid ${ti === bonusItem.bonus_tags!.length - 1 ? 'rgba(245,197,66,0.25)' : 'rgba(108,58,237,0.2)'}` }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {bonusItem.featured_image_url && (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(245,197,66,0.2)', boxShadow: '0 0 40px rgba(245,197,66,0.08)' }}>
                    <img src={bonusItem.featured_image_url} alt={bonusItem.title} style={{ width: '100%', maxWidth: 400, display: 'block' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 40 }}><CtaButton /></div>
      </section>

      {/* TRANSITION: Offer → Who This Is For */}
      <WaveDivider variant="teal" />

      {/* ===== WHO THIS IS FOR ===== */}
      <section className="section-dark tech-grid-bg">
        <div className="section fade-in-section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>{content.audience_section.label}</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>{content.audience_section.title}</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, textAlign: 'left' }}>
            <div className="card card-glow-teal" style={{ borderColor: 'rgba(16,185,129,0.25)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', marginBottom: 20 }}>This is for you if...</h3>
              {content.audience_section.for_items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}><span style={{ color: 'var(--success)', flexShrink: 0, fontWeight: 700 }}>&#10004;</span><span style={{ color: 'var(--text-secondary)' }}>{item}</span></div>
              ))}
            </div>
            <div className="card card-glow-purple" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', marginBottom: 20 }}>This is not for you if...</h3>
              {content.audience_section.not_for_items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}><span style={{ color: 'var(--danger)', flexShrink: 0, fontWeight: 700 }}>&#10006;</span><span style={{ color: 'var(--text-secondary)' }}>{item}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRANSITION: Who This Is For → Hosts */}
      <GlowDivider type="orb" />

      {/* ===== HOSTS / SPEAKERS ===== */}
      <section className="section fade-in-section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          {eventHosts.length > 1 ? 'Your hosts' : 'Your instructor'}
        </p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>
          {eventHosts.length > 1 ? 'Learn from industry leaders' : 'Meet your instructor'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48, maxWidth: 960, margin: '0 auto' }}>
          {eventHosts.map((eh, idx) => {
            const host = eh.hosts
            const isFirst = idx === 0
            return (
              <div key={eh.host_id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 40, alignItems: 'center', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'center', order: isFirst ? 0 : 1 }}>
                  <div className="headshot-container">
                    <img src={host.headshot_url || '/headshot.jpg'} alt={`${host.name} — ${host.title}`} />
                  </div>
                </div>
                <div style={{ order: isFirst ? 1 : 0 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: isFirst ? 'var(--accent-light)' : 'var(--teal)', background: isFirst ? 'rgba(108,58,237,0.1)' : 'rgba(45,212,191,0.1)', padding: '4px 12px', borderRadius: 100, border: `1px solid ${isFirst ? 'rgba(108,58,237,0.3)' : 'rgba(45,212,191,0.3)'}` }}>
                      {eh.role || (isFirst ? 'Lead Instructor' : 'Co-Host')}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{host.name}</h2>
                  <p style={{ fontSize: 16, color: 'var(--accent-light)', fontWeight: 600, marginBottom: 20 }}>{host.title}{host.company ? ` — ${host.company}` : ''}</p>
                  {renderRichText(host.bio || host.short_description || '', { fontSize: 16, color: 'var(--text-secondary)', marginBottom: 16 })}
                  {(host.stat1_value || host.stat2_value || host.stat3_value) && (
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 24 }}>
                      {[
                        { value: host.stat1_value, label: host.stat1_label },
                        { value: host.stat2_value, label: host.stat2_label },
                        { value: host.stat3_value, label: host.stat3_label },
                      ].filter(s => s.value).map((stat, si) => (
                        <div key={si} style={{ padding: '12px 0' }}>
                          <div style={{ fontSize: 22, fontWeight: 800 }} className="gradient-text">{stat.value}</div>
                          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {eventHosts.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center', textAlign: 'left', maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="headshot-container">
                <img src="/headshot.jpg" alt="Daniel Knight — Founder, Night Vibe" />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Daniel Knight</h2>
              <p style={{ fontSize: 16, color: 'var(--accent-light)', fontWeight: 600, marginBottom: 20 }}>Founder, Night Vibe — AI App Development Company</p>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>Daniel builds AI-powered business systems that create real, measurable impact. His systems have generated nearly $100M in revenue for the organizations and clients he have built for.</p>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>He has personally earned approximately $400K in commissions from the systems he has built — and now teaches business owners how to do the same using the latest AI tools.</p>
            </div>
          </div>
        )}
      </section>

      {/* ===== UPCOMING EVENTS ===== */}
      {upcomingEvents.length > 1 && (
        <>
        <WaveDivider variant="mixed" />
        <section className="section-dark">
          <div className="section fade-in-section" id="upcoming-events">
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Upcoming sessions</p>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>Pick the date that works for you</h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>Multiple sessions available. Same workshop, same results — choose when you want to build.</p>
            <div style={{ display: 'grid', gap: 16, maxWidth: 700, margin: '0 auto' }}>
              {upcomingEvents.map((ue) => {
                const ueTicket = ue.event_tickets?.[0]
                const ueSeats = ueTicket ? ueTicket.capacity - ueTicket.sold_count : 0
                const ueSoldOut = ueSeats <= 0 || ue.status === 'sold_out'
                return (
                  <div key={ue.id} className="card card-glow-purple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, textAlign: 'left' }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{ue.title}</h3>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{new Date(ue.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>${ueTicket?.price || 997} · {ueSoldOut ? 'SOLD OUT' : `${ueSeats} seats left`}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {ueSoldOut ? (<a href={`/events/${ue.slug}`} style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700, color: 'var(--accent-light)', border: '2px solid rgba(108,58,237,0.4)', borderRadius: 12, textDecoration: 'none', transition: 'all 0.3s ease' }}>Sold Out — View Details</a>) : (<><a href={`/events/${ue.slug}`} style={{ padding: '10px 20px', fontSize: 14, fontWeight: 700, color: 'var(--accent-light)', border: '2px solid rgba(108,58,237,0.4)', borderRadius: 12, textDecoration: 'none', transition: 'all 0.3s ease' }}>View</a><CtaButton label="Register" style={{ padding: '10px 24px', fontSize: 14 }} /></>)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
        </>
      )}

      {/* TRANSITION: → Pricing */}
      <GlowDivider type="line" />

      {/* ===== PRICING ===== */}
      <section className="section fade-in-section" id="pricing">
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Reserve your seat</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 8 }}>${price}</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>{content.pricing_section.subtitle}</p>

          <div className="card glow-ring" style={{ textAlign: 'left', borderColor: 'var(--accent)', padding: 36, marginBottom: 24 }}>
            {(offerItems.length > 0 ? offerItems : [
              { icon: '🎬', title: 'Live 2-day build sprint', is_bonus: false },
              { icon: '💻', title: 'Functional app built and deployed', is_bonus: false },
              { icon: '🎥', title: 'Full recording access', is_bonus: false },
              { icon: '📝', title: 'SOPs, blueprints, and training docs', is_bonus: false },
              { icon: '👥', title: 'Community access', is_bonus: false },
              { icon: '🔄', title: 'Free access to future sessions', is_bonus: false },
              { icon: '⭐', title: '20-person intimate cohort with live Q&A', is_bonus: false },
            ] as { icon: string; title: string; is_bonus: boolean }[]).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontWeight: item.is_bonus ? 700 : 400, color: item.is_bonus ? 'var(--gold)' : 'inherit' }}>{item.is_bonus ? `BONUS: ${item.title}` : item.title}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0', paddingTop: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>{content.pricing_section.special_offer_title}</p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{content.pricing_section.special_offer_text}</p>
            </div>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div className="seat-counter" style={{ marginBottom: 20, justifyContent: 'center', width: '100%' }}><span className="seat-dot" />{isSoldOut ? 'SOLD OUT' : `${seatsLeft} of ${event?.capacity || 20} seats remaining`}</div>
              <CtaButton label="Reserve Your Seat" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{content.pricing_section.checkout_note}</p>
        </div>
      </section>

      {/* ===== GUARANTEE ===== */}
      {guarantees.length > 0 && (
        <section className="section" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            {guarantees.map((g) => (
              <div key={g.id} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', border: '2px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: 'clamp(28px, 4vw, 48px)', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{g.icon}</div>
                <div style={{ display: 'inline-block', background: 'rgba(16,185,129,0.15)', padding: '6px 20px', borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#10b981', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>{g.badge_text}</div>
                <h3 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>{g.title}</h3>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>{g.description}</p>
                {g.fine_print && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, fontStyle: 'italic' }}>{g.fine_print}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TRANSITION: → FAQ */}
      <WaveDivider variant="purple" />

      {/* ===== FAQ ===== */}
      <section className="section-dark">
        <div className="section fade-in-section" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Questions</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>Frequently asked questions</h2>
          {content.faq_items.map((item, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, paddingRight: 16 }}>{item.q}</h3>
                <span className="faq-icon" style={{ fontSize: 22, color: 'var(--accent-light)', flexShrink: 0, fontWeight: 300 }}>+</span>
              </div>
              <div className="faq-answer"><p style={{ fontSize: 15 }}>{item.a}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* TRANSITION: → Contact */}
      <GlowDivider type="scan" />

      {/* ===== CONTACT / QUESTIONS ===== */}
      <section className="section fade-in-section" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Have questions?</p>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, marginBottom: 8 }}>Get in touch</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32 }}>Not sure if this workshop is right for you? Ask us anything.</p>
          {contactSubmitted ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>&#9989;</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Message sent</h3>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>We will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="card" style={{ textAlign: 'left', padding: 32 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Name</label>
                <input className="admin-input" type="text" required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} placeholder="Your name" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Email</label>
                <input className="admin-input" type="email" required value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="you@email.com" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Message</label>
                <textarea className="admin-input" required value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} placeholder="What would you like to know?" style={{ minHeight: 100 }} />
              </div>
              <button type="submit" className="btn-accent" style={{ width: '100%' }} disabled={contactSubmitting}>
                {contactSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* TRANSITION: → Final CTA */}
      <GlowDivider type="orb" />

      {/* ===== FINAL CTA ===== */}
      <section className="section fade-in-section" style={{ paddingBottom: 120 }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }} className="gradient-text">{content.final_cta.title}</h2>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 12, maxWidth: 600, margin: '0 auto 12px' }}>{event ? `${new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}` : 'Coming Soon'}. {event?.capacity || 20} seats only.</p>
        <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 28 }}>${price}</p>
        <div className="seat-counter" style={{ marginBottom: 28 }}><span className="seat-dot" />{isSoldOut ? 'SOLD OUT — Join Waitlist Below' : `${seatsLeft} seats remaining — these will go fast`}</div>
        <div style={{ marginBottom: 16 }}><CtaButton /></div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>{content.final_cta.subtitle}</p>
        <div style={{ marginTop: 48, paddingTop: 48, borderTop: '1px solid var(--border)' }}><p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Night Vibe — AI App Development Company</p></div>
      </section>

      {/* STICKY CTA */}
      <div className={`sticky-cta ${showSticky ? 'visible' : ''}`}>
        <div className="seat-counter" style={{ fontSize: 13 }}><span className="seat-dot" />{seatsLeft} seats left</div>
        <button className="btn-accent btn-accent-sm" onClick={handleCheckout} disabled={checkoutLoading}>
          {isSoldOut ? 'View Details' : 'Reserve Your Seat'}
        </button>
      </div>

      {/* WAITLIST MODAL */}
      {showWaitlist && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowWaitlist(false) }}>
          <div className="modal-content">
            {waitlistSubmitted ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>&#10004;&#65039;</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You are on the list</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>We will notify you as soon as seats open up or when the next session is announced.</p>
                <button className="btn-secondary" onClick={() => { setShowWaitlist(false); setWaitlistSubmitted(false) }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Join the Waitlist</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, textAlign: 'center' }}>Be the first to know when seats open up or when we announce future sessions.</p>
                <form onSubmit={handleWaitlistSubmit}>
                  <div style={{ marginBottom: 14 }}><input className="admin-input" type="text" placeholder="Your name" required value={waitlistForm.name} onChange={(e) => setWaitlistForm({ ...waitlistForm, name: e.target.value })} /></div>
                  <div style={{ marginBottom: 14 }}><input className="admin-input" type="email" placeholder="Your email" required value={waitlistForm.email} onChange={(e) => setWaitlistForm({ ...waitlistForm, email: e.target.value })} /></div>
                  <div style={{ marginBottom: 14 }}><input className="admin-input" type="tel" placeholder="Phone number (optional)" value={waitlistForm.phone} onChange={(e) => setWaitlistForm({ ...waitlistForm, phone: e.target.value })} /></div>
                  <div style={{ marginBottom: 20 }}><input className="admin-input" type="text" placeholder="Company (optional)" value={waitlistForm.company} onChange={(e) => setWaitlistForm({ ...waitlistForm, company: e.target.value })} /></div>
                  <button type="submit" className="btn-accent" style={{ width: '100%' }}>Get Notified</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
