'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface EventData {
  id: string
  title: string
  subtitle: string
  start_date: string
  end_date: string
  timezone: string
  capacity: number
  status: string
  stripe_payment_link: string
  landing_page_data: {
    hero_headlines: string[]
    special_offer: string
    software_budget: string
    instructor_name: string
    company_name: string
    company_tagline: string
  }
  event_tickets: {
    id: string
    sold_count: number
    capacity: number
    price: number
    status: string
  }[]
}

export default function LandingPage() {
  const [event, setEvent] = useState<EventData | null>(null)
  const [seatsLeft, setSeatsLeft] = useState<number>(20)
  const [isSoldOut, setIsSoldOut] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const [showWaitlist, setShowWaitlist] = useState(false)
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', company: '' })
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEvent = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('*, event_tickets(*)')
      .eq('is_featured', true)
      .in('status', ['published', 'sold_out'])
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
    }
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
    await supabase.from('waitlist_signups').insert({
      event_id: event.id,
      name: waitlistForm.name,
      email: waitlistForm.email,
      company: waitlistForm.company || null,
    })
    setWaitlistSubmitted(true)
  }

  const ctaUrl = event?.stripe_payment_link || '#'
  const price = event?.event_tickets?.[0]?.price || 997

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      {/* URGENCY BANNER */}
      <div className="urgency-banner">
        <span style={{ marginRight: 8 }}>&#9679;</span>
        LIVE Workshop — April 7-8, 2026 — Only {seatsLeft} of 20 seats remain
      </div>

      {/* ===== SECTION 1: HERO ===== */}
      <section style={{ padding: '80px 20px 60px', textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
        {/* Micro-badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,58,237,0.1)', border: '1px solid rgba(108,58,237,0.3)', padding: '8px 20px', borderRadius: 100, marginBottom: 28, fontSize: 14, fontWeight: 600, color: 'var(--accent-light)' }}>
          Night Vibe — AI App Development
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }} className="gradient-text" id="hero-headline">
          {event?.title || 'Build & Launch Your Profitable App Using Claude & Top AI Tools'}
        </h1>

        <p style={{ fontSize: 'clamp(17px, 2.2vw, 21px)', color: 'var(--text-secondary)', maxWidth: 700, margin: '0 auto 28px', lineHeight: 1.6 }}>
          {event?.subtitle || 'In this live 2-day workshop, you will turn a real business problem into a working AI app that saves time or generates revenue, even if you are not a developer.'}
        </p>

        {/* Event details row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginBottom: 28, fontSize: 15, color: 'var(--text-secondary)' }}>
          <span>&#128197; April 7-8, 2026</span>
          <span>&#128336; 9 AM – 1 PM Pacific</span>
          <span>&#128187; Live Virtual</span>
          <span style={{ fontWeight: 700, color: 'white' }}>&#36;{price}</span>
        </div>

        {/* Seat counter */}
        <div style={{ marginBottom: 32 }}>
          <div className="seat-counter">
            <span className="seat-dot" />
            {isSoldOut ? 'SOLD OUT — Join Waitlist' : `Only ${seatsLeft} of 20 seats left`}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
          {isSoldOut ? (
            <button className="btn-accent" onClick={() => setShowWaitlist(true)}>
              Join the Waitlist
            </button>
          ) : (
            <a href={ctaUrl} className="btn-accent" target="_blank" rel="noopener noreferrer">
              Reserve Your Seat — ${price}
            </a>
          )}
          {!isSoldOut && (
            <button className="btn-secondary" onClick={() => setShowWaitlist(true)}>
              Join the Waitlist
            </button>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Live 2-day workshop. 20 seats only. Recording included. Designed for business owners, not developers.
        </p>
      </section>

      {/* ===== SECTION 2: PAIN / PROBLEM ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The problem</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 32, lineHeight: 1.2 }}>
            You know AI can change your business.<br />
            <span style={{ color: 'var(--text-secondary)' }}>You just have not found the right way in.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: '&#128260;', title: 'Drowning in manual work', desc: 'You are doing the same tasks by hand every week. Things that should be automated are eating your hours and killing your margins.' },
              { icon: '&#128184;', title: 'Paying for too many tools', desc: 'Your tech stack costs hundreds per month. Half the features go unused. You know you could build something better and cheaper.' },
              { icon: '&#128566;', title: 'AI feels overwhelming', desc: 'You see the potential but every course is theory-heavy, developer-focused, or too broad to be useful for your specific business.' },
              { icon: '&#128161;', title: 'Ideas that never launch', desc: 'You have had the app idea for months. Maybe years. But hiring a developer costs $10K-$50K and you are not sure it will even work.' },
              { icon: '&#9203;', title: 'Falling behind competitors', desc: 'Every month you wait, someone else in your industry is automating, building, and pulling ahead. The gap is growing.' },
              { icon: '&#128683;', title: 'Do not want to learn code', desc: 'You are a business builder, not a programmer. You need a practical path that works with your skills, not against them.' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: item.icon }} />
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 36, fontSize: 18, fontWeight: 600, color: 'var(--warning)' }}>
            The real cost of waiting is not just money. It is lost time, missed revenue, and falling further behind every single month.
          </p>
        </div>
      </section>

      {/* ===== SECTION 3: TRANSFORMATION ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The transformation</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>
          Walk in with a problem. Walk out with a working app.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.03)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>Before the workshop</h3>
            {['Stuck with ideas that never move forward', 'Paying for fragmented SaaS tools', 'Manual processes eating your time', 'Confused about where to start with AI', 'Dependent on expensive developers', 'No clear path from idea to revenue'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 15, color: 'var(--text-secondary)' }}>
                <span style={{ color: '#EF4444', flexShrink: 0 }}>&#10006;</span>
                {item}
              </div>
            ))}
          </div>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.03)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>After the workshop</h3>
            {['A working app deployed and live on the web', 'A clearer offer tied to real business outcomes', 'Skills to build more apps on your own', 'A system that saves time or generates revenue', 'Full ownership of your code and product', 'Confidence to execute with modern AI tools'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 15, color: 'var(--text-secondary)' }}>
                <span style={{ color: '#10B981', flexShrink: 0 }}>&#10004;</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          {isSoldOut ? (
            <button className="btn-accent" onClick={() => setShowWaitlist(true)}>Join the Waitlist</button>
          ) : (
            <a href={ctaUrl} className="btn-accent" target="_blank" rel="noopener noreferrer">Reserve Your Seat — ${price}</a>
          )}
        </div>
      </section>

      {/* ===== SECTION 4: WHY THIS WORKSHOP IS DIFFERENT ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Why this is different</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            This is not a course. This is a build sprint.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650 }}>
            You do not sit and watch. You open your laptop, follow along live, and walk out with something real.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="comparison-table">
              <thead>
                <tr style={{ background: 'rgba(108,58,237,0.05)' }}>
                  <th style={{ width: '40%' }}>Feature</th>
                  <th>Typical AI Course</th>
                  <th style={{ color: 'var(--accent-light)' }}>This Workshop</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Format', 'Pre-recorded videos', 'Live, guided build sessions'],
                  ['Outcome', 'Knowledge (maybe)', 'A deployed, working app'],
                  ['Support', 'Community forum', '20-person live Q&A'],
                  ['Duration', 'Weeks or months', '2 days, 8 hours total'],
                  ['Focus', 'Broad AI theory', 'Your specific business problem'],
                  ['Tools', 'Outdated or generic', 'Claude + Supabase + Vercel (2026 stack)'],
                  ['After the event', 'You are on your own', 'Community + future sessions included'],
                ].map(([feature, typical, ours], i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{feature}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{typical}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 500 }}>{ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: WHAT YOU WILL BUILD ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>What you will build</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
          Real apps. Real revenue. Real time savings.
        </h2>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650 }}>
          You do not need the perfect idea before joining. The workshop helps you identify the right use case for your business.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { icon: '&#128736;', title: 'Internal Team Tools', desc: 'Automate reporting, onboarding, scheduling, or any process your team does manually' },
            { icon: '&#128101;', title: 'Customer-Facing Tools', desc: 'Build portals, calculators, dashboards, or self-service tools your customers will love' },
            { icon: '&#127919;', title: 'Lead Generation Tools', desc: 'Create interactive tools that capture leads and qualify prospects automatically' },
            { icon: '&#9889;', title: 'Workflow Automation', desc: 'Connect systems, eliminate repetitive tasks, and save hours every week' },
            { icon: '&#128176;', title: 'Paid Micro-SaaS', desc: 'Build a small software product you can charge for — a new income stream from day one' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: item.icon }} />
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div className="seat-counter" style={{ marginBottom: 20 }}>
            <span className="seat-dot" />
            {seatsLeft} seats remaining
          </div>
          <br />
          {isSoldOut ? (
            <button className="btn-accent" onClick={() => setShowWaitlist(true)}>Join the Waitlist</button>
          ) : (
            <a href={ctaUrl} className="btn-accent" target="_blank" rel="noopener noreferrer">Reserve Your Seat</a>
          )}
        </div>
      </section>

      {/* ===== SECTION 6: WHAT YOU WILL LEARN ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>What you will learn</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>
            Four skills. Two days. One working app.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { num: '01', title: 'Build your app backend without coding', desc: 'Use Claude and modern AI tools to create the logic, structure, and functionality of your app — guided step by step.' },
              { num: '02', title: 'Connect a real database', desc: 'Set up Supabase to store and manage your app data. No SQL experience needed — we walk through every click.' },
              { num: '03', title: 'Deploy it live on the web', desc: 'Push your app to Vercel so anyone with a link can use it. Your app goes from laptop to live in minutes.' },
              { num: '04', title: 'Create a landing page to validate or sell it', desc: 'Build a simple page that lets you test demand, collect leads, or start generating revenue immediately.' },
            ].map((item, i) => (
              <div key={i} className="card">
                <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent)', opacity: 0.3, marginBottom: 8, lineHeight: 1 }}>{item.num}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: WHY CLAUDE ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The tool stack</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
          Why Claude is the engine behind this workshop
        </h2>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650 }}>
          Claude is not just another AI chatbot. It is the most capable tool available for building real software — and the numbers back it up.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
          {[
            { stat: '#1', label: 'Fastest-growing GenAI tool of 2026' },
            { stat: '7.38M', label: 'Active users worldwide' },
            { stat: '300K', label: 'Businesses use Claude Enterprise' },
            { stat: '300%', label: 'Increase in active users in 2025' },
            { stat: '200K', label: 'Token context window for complex work' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--accent-light)', marginBottom: 4 }}>{item.stat}</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.label}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 650, lineHeight: 1.7 }}>
          Claude handles complex multi-file applications, understands your business context with its massive context window, and produces production-ready code. Combined with Supabase, Vercel, and supporting tools, you get a modern stack that lets non-developers build real software.
        </p>
      </section>

      {/* ===== SECTION 8: OFFER STACK ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Everything included</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>
            This is not just a workshop. It is a full implementation package.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {[
              { icon: '&#127916;', title: 'Live 2-Day Build Sprint', desc: '8 hours of guided, hands-on building across two focused sessions. Not lectures — execution.', value: '' },
              { icon: '&#128187;', title: 'Your Functional App', desc: 'Walk away with a real, deployed application that works. Not a mockup. Not a prototype. A live app.', value: '' },
              { icon: '&#127909;', title: 'Full Recording Access', desc: 'Every session recorded so you can revisit any step. Reference it anytime you build your next app.', value: '' },
              { icon: '&#128221;', title: 'Complete SOPs & Procedures', desc: 'Step-by-step documentation for every technique covered. Your permanent reference library.', value: '' },
              { icon: '&#128218;', title: 'The 3-Step AI App Blueprint', desc: 'Our proprietary framework for going from business problem to working app. The same process used in this workshop.', value: '' },
              { icon: '&#128196;', title: 'Plug-and-Play Training Docs', desc: 'Pre-built templates and guides for the full tool stack: Claude, Supabase, Vercel, and more.', value: '' },
              { icon: '&#128101;', title: 'Community Access', desc: 'Join a community of builders who share resources, ask questions, and help each other grow.', value: '' },
              { icon: '&#128260;', title: 'Future Session Access', desc: 'Every future workshop session is included. Build more apps, learn new tools, keep growing.', value: '' },
              { icon: '&#127775;', title: 'Intimate 20-Person Q&A', desc: 'Small cohort means personal attention. Get your specific questions answered in real time.', value: '' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: item.icon }} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            {isSoldOut ? (
              <button className="btn-accent" onClick={() => setShowWaitlist(true)}>Join the Waitlist</button>
            ) : (
              <a href={ctaUrl} className="btn-accent" target="_blank" rel="noopener noreferrer">Reserve Your Seat — ${price}</a>
            )}
          </div>
        </div>
      </section>

      {/* ===== SECTION 9: WHO THIS IS FOR ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Is this right for you</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>
          This workshop is built for a specific kind of person
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', marginBottom: 20 }}>This is for you if...</h3>
            {[
              'You already run a business or have a clear offer',
              'You want to replace software tools or build a new revenue stream',
              'You are ready to execute live, not just watch',
              'You want a working app, not more theory',
              'You are comfortable using AI tools and following guidance',
              'You want to move fast and build something real this month',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}>
                <span style={{ color: 'var(--success)', flexShrink: 0, fontWeight: 700 }}>&#10004;</span>
                <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', marginBottom: 20 }}>This is not for you if...</h3>
            {[
              'You just want to learn about AI without building anything',
              'You are looking for a passive video course you can watch later',
              'You are not willing to show up live for both days',
              'You do not have a business problem or idea to work on',
              'You expect someone else to build your app for you',
              'You are looking for the cheapest option, not the best outcome',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}>
                <span style={{ color: 'var(--danger)', flexShrink: 0, fontWeight: 700 }}>&#10006;</span>
                <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 10: SOFTWARE + SETUP ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Setup & tools</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>
            Simple tools. Small budget. Big results.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650 }}>
            Expect about $50/month in software costs. Everything is beginner-friendly and guided live during the workshop.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { name: 'Claude', cost: '$20/mo', desc: 'Your AI building partner' },
              { name: 'Supabase', cost: 'Free', desc: 'Database & authentication' },
              { name: 'Vercel', cost: 'Free', desc: 'Hosting & deployment' },
              { name: 'Emergent Labs', cost: '$20/mo', desc: 'AI development tools' },
              { name: 'Gemini', cost: 'Free', desc: 'Supporting AI assistant' },
              { name: 'Gamma', cost: 'Free', desc: 'Presentations & docs' },
            ].map((tool, i) => (
              <div key={i} className="card" style={{ padding: 20, textAlign: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{tool.name}</h3>
                <div style={{ fontSize: 20, fontWeight: 800, color: tool.cost === 'Free' ? 'var(--success)' : 'var(--accent-light)', marginBottom: 4 }}>{tool.cost}</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 11: SOCIAL PROOF ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Results</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>
          What past participants are saying
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ borderStyle: 'dashed' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--text-muted)' }}>&#128100;</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Client Name</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Company / Role</div>
                </div>
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                &ldquo;Client result / testimonial goes here. This is a placeholder for a real testimonial from a workshop participant.&rdquo;
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>Workshop screenshots and additional proof will be added here</p>
        </div>
      </section>

      {/* ===== SECTION 12: ABOUT THE INSTRUCTOR ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Your instructor</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
            <div>
              {/* Headshot placeholder */}
              <div style={{ width: '100%', maxWidth: 320, aspectRatio: '1', borderRadius: 20, background: 'linear-gradient(135deg, var(--bg-dark), var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--border)' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 60, marginBottom: 8 }}>&#128100;</div>
                  <p style={{ fontSize: 13 }}>Instructor headshot</p>
                </div>
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Daniel Knight</h2>
              <p style={{ fontSize: 16, color: 'var(--accent-light)', fontWeight: 600, marginBottom: 20 }}>Founder, Night Vibe — AI App Development Company</p>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                Daniel builds AI-powered business systems that create real, measurable impact. His work has been tied to nearly $100M in charitable contribution volume through the systems he has designed and implemented.
              </p>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>
                He has personally generated approximately $400K from the systems he has built — and now teaches business owners how to do the same using the latest AI tools. His approach is practical, direct, and focused entirely on execution.
              </p>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-light)' }}>~$100M</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Charitable impact volume</p>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-light)' }}>~$400K</div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Personal systems revenue</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 13: PRICING ===== */}
      <section className="section" id="pricing">
        <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Reserve your seat</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 8 }}>
            ${price}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>
            One-time investment. Lifetime access to recordings and community.
          </p>

          <div className="card glow-ring" style={{ textAlign: 'left', borderColor: 'var(--accent)', padding: 36, marginBottom: 24 }}>
            {[
              'Live 2-day build sprint (April 7-8)',
              '9 AM – 1 PM Pacific each day',
              'Functional app built and deployed',
              'Full recording access',
              'SOPs, blueprints, and training docs',
              'Community access',
              'All future workshop sessions',
              '20-person intimate cohort with live Q&A',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}>
                <span style={{ color: 'var(--success)', flexShrink: 0 }}>&#10004;</span>
                <span>{item}</span>
              </div>
            ))}

            <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0', paddingTop: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>
                Special Offer
              </p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                Bring 3 employees or 3 friends and your session is free.
              </p>
            </div>

            <div style={{ marginTop: 24 }}>
              <div className="seat-counter" style={{ marginBottom: 20, justifyContent: 'center', width: '100%' }}>
                <span className="seat-dot" />
                {isSoldOut ? 'SOLD OUT' : `${seatsLeft} of 20 seats remaining`}
              </div>

              {isSoldOut ? (
                <button className="btn-accent" style={{ width: '100%' }} onClick={() => setShowWaitlist(true)}>
                  Join the Waitlist
                </button>
              ) : (
                <a href={ctaUrl} className="btn-accent" style={{ width: '100%', display: 'block' }} target="_blank" rel="noopener noreferrer">
                  Reserve Your Seat — ${price}
                </a>
              )}
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Secure checkout via Stripe. Instant confirmation. Calendar invite sent within minutes.
          </p>
        </div>
      </section>

      {/* ===== SECTION 14: FAQ ===== */}
      <section className="section-dark">
        <div className="section" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, textAlign: 'center' }}>Questions</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2, textAlign: 'center' }}>
            Frequently asked questions
          </h2>

          {[
            { q: 'Do I need to know how to code?', a: 'No. This workshop is designed for business owners and non-developers. You will use AI tools to build your app with guided, step-by-step instructions. If you can use a computer and follow directions, you can do this.' },
            { q: 'What kind of app can I build?', a: 'Internal tools, customer-facing products, lead generation tools, workflow automation, or even a paid micro-SaaS. The workshop helps you identify the right use case for your specific business.' },
            { q: 'What if I do not have my idea yet?', a: 'That is completely fine. The workshop includes a framework for identifying the best app opportunity for your business. You will have clarity before you start building.' },
            { q: 'Will I really finish with something functional?', a: 'Yes. The entire workshop is structured so you build and deploy a working app by the end of Day 2. It will be live on the internet, functional, and yours to keep.' },
            { q: 'What tools do I need?', a: 'A computer with internet access. You will need accounts on Claude ($20/mo), Supabase (free), Vercel (free), and optionally Emergent Labs ($20/mo). Total software budget is about $50/month.' },
            { q: 'Is the recording included?', a: 'Yes. Full recordings of both days are included with your registration. You can rewatch any section anytime.' },
            { q: 'What if the workshop sells out?', a: 'Join the waitlist. You will be first to know when we announce the next session. All future sessions are included with your purchase when you do register.' },
            { q: 'Can I bring my team?', a: 'Yes. Bring 3 employees or 3 friends and your seat is free. Each person does need their own device to build alongside the session.' },
            { q: 'What timezone is this in?', a: 'All sessions run 9:00 AM to 1:00 PM Pacific Time (PT). That is 12:00 PM to 4:00 PM Eastern.' },
            { q: 'Is there ongoing support?', a: 'Yes. Your registration includes community access and all future workshop sessions. You are not left on your own after the event.' },
          ].map((item, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, paddingRight: 16 }}>{item.q}</h3>
                <span className="faq-icon" style={{ fontSize: 22, color: 'var(--accent-light)', flexShrink: 0, fontWeight: 300 }}>+</span>
              </div>
              <div className="faq-answer">
                <p style={{ fontSize: 15 }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SECTION 15: FINAL CTA ===== */}
      <section className="section" style={{ textAlign: 'center', paddingBottom: 120 }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }} className="gradient-text">
          Two days from now, you could have a working app.
        </h2>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 12, maxWidth: 600, margin: '0 auto 12px' }}>
          April 7-8, 2026. 9 AM – 1 PM Pacific. 20 seats only.
        </p>
        <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 28 }}>${price}</p>

        <div className="seat-counter" style={{ marginBottom: 28 }}>
          <span className="seat-dot" />
          {isSoldOut ? 'SOLD OUT — Join Waitlist Below' : `${seatsLeft} seats remaining — these will go fast`}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 16 }}>
          {isSoldOut ? (
            <button className="btn-accent" onClick={() => setShowWaitlist(true)}>Join the Waitlist</button>
          ) : (
            <a href={ctaUrl} className="btn-accent" target="_blank" rel="noopener noreferrer">Reserve Your Seat — ${price}</a>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
          Secure checkout. Instant access. Recording included.
        </p>

        <div style={{ marginTop: 48, paddingTop: 48, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Night Vibe — AI App Development Company
          </p>
        </div>
      </section>

      {/* ===== STICKY CTA BAR ===== */}
      <div className={`sticky-cta ${showSticky ? 'visible' : ''}`}>
        <div className="seat-counter" style={{ fontSize: 13 }}>
          <span className="seat-dot" />
          {seatsLeft} seats left
        </div>
        {isSoldOut ? (
          <button className="btn-accent btn-accent-sm" onClick={() => setShowWaitlist(true)}>Join Waitlist</button>
        ) : (
          <a href={ctaUrl} className="btn-accent btn-accent-sm" target="_blank" rel="noopener noreferrer">Reserve Your Seat — ${price}</a>
        )}
      </div>

      {/* ===== WAITLIST MODAL ===== */}
      {showWaitlist && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowWaitlist(false) }}>
          <div className="modal-content">
            {waitlistSubmitted ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>&#10004;&#65039;</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You are on the list</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
                  We will notify you as soon as seats open up or when the next session is announced.
                </p>
                <button className="btn-secondary" onClick={() => { setShowWaitlist(false); setWaitlistSubmitted(false) }}>Close</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Join the Waitlist</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
                  Be the first to know when seats open up or when we announce future sessions.
                </p>
                <form onSubmit={handleWaitlistSubmit}>
                  <div style={{ marginBottom: 14 }}>
                    <input className="admin-input" type="text" placeholder="Your name" required value={waitlistForm.name} onChange={(e) => setWaitlistForm({ ...waitlistForm, name: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <input className="admin-input" type="email" placeholder="Your email" required value={waitlistForm.email} onChange={(e) => setWaitlistForm({ ...waitlistForm, email: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <input className="admin-input" type="text" placeholder="Company (optional)" value={waitlistForm.company} onChange={(e) => setWaitlistForm({ ...waitlistForm, company: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-accent" style={{ width: '100%' }}>Get Notified</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
