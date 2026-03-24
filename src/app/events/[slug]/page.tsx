'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import ParticleBackground from '@/components/ParticleBackground';
import RevenueCalculator from '@/components/RevenueCalculator';
import Link from 'next/link';
import { renderRichText } from '@/lib/richText';

interface Host {
  id: string;
  name: string;
  title: string;
  company: string;
  short_description: string;
  bio: string;
  headshot_url: string;
  category: string;
  stat1_value?: string;
  stat1_label?: string;
  stat2_value?: string;
  stat2_label?: string;
  stat3_value?: string;
  stat3_label?: string;
}

interface EventHost {
  host_id: string;
  role: string;
  display_order: number;
  hosts: Host;
}

interface EventTicket {
  price: number;
  sold_count: number;
  capacity: number;
  stripe_payment_link: string;
}

interface OfferItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  glow: string;
  is_bonus: boolean;
  display_order: number;
  featured_image_url?: string;
  bonus_description?: string;
  bonus_tags?: string[];
}

interface EventOfferItem {
  offer_item_id: string;
  display_order: number;
  offer_items: OfferItem;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  start_date: string;
  end_date: string;
  timezone: string;
  capacity: number;
  status: string;
  theme: string;
  stripe_payment_link: string;
  event_tickets: EventTicket[];
  event_hosts: EventHost[];
  event_offer_items: EventOfferItem[];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventData | null>(null);
  const [hosts, setHosts] = useState<EventHost[]>([]);
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [submittingWaitlist, setSubmittingWaitlist] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const fetchEventData = useCallback(async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`*, event_tickets(*), event_hosts(*, hosts(*)), event_offer_items(*, offer_items(*))`)
        .eq('slug', slug)
        .in('status', ['published', 'sold_out'])
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error('Event not found');

      setEvent(eventData as EventData);

      if (eventData.event_hosts) {
        const sortedHosts = [...(eventData.event_hosts as EventHost[])].sort(
          (a, b) => a.display_order - b.display_order
        );
        setHosts(sortedHosts);
      }

      if (eventData.event_offer_items) {
        const sortedOffers = [...(eventData.event_offer_items as EventOfferItem[])]
          .sort((a, b) => a.display_order - b.display_order)
          .map(eoi => eoi.offer_items)
          .filter(Boolean);
        setOfferItems(sortedOffers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchEventData();
  }, [slug, fetchEventData]);

  useEffect(() => {
    const interval = setInterval(fetchEventData, 30000);
    return () => clearInterval(interval);
  }, [fetchEventData]);

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setSubmittingWaitlist(true);
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, ...waitlistForm })
      });
      if (!response.ok) throw new Error('Failed to join waitlist');
      setWaitlistSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join waitlist');
    } finally {
      setSubmittingWaitlist(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', flexDirection: 'column', gap: 16 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>Event Not Found</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{error || 'This event could not be loaded.'}</p>
        <Link href="/events" className="btn-accent">Back to Events</Link>
      </div>
    );
  }

  const seatsLeft = Math.max(0, event.capacity - (event.event_tickets[0]?.sold_count || 0));
  const isSoldOut = event.status === 'sold_out' || seatsLeft <= 0;
  const ctaUrl = event.stripe_payment_link || event.event_tickets[0]?.stripe_payment_link || '#';
  const price = event.event_tickets[0]?.price || 997;

  const eventDate = new Date(event.start_date);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthName = months[eventDate.getUTCMonth()];
  const day = eventDate.getUTCDate();
  const year = eventDate.getUTCFullYear();
  const hours = eventDate.getUTCHours();
  const minutes = eventDate.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  const shortDate = `${monthName} ${day}, ${year}`;

  const tzMap: Record<string, string> = {
    'America/Los_Angeles': 'Pacific',
    'America/Denver': 'Mountain',
    'America/Chicago': 'Central',
    'America/New_York': 'Eastern',
    'US/Pacific': 'Pacific',
    'US/Mountain': 'Mountain',
    'US/Central': 'Central',
    'US/Eastern': 'Eastern',
    'UTC': 'UTC',
  };
  const tz = event.timezone || '';
  const displayTimezone = tzMap[tz] || tz.replace(/_/g, ' ').replace(/^.*\//, '') || '';

  const endDate = event.end_date ? new Date(event.end_date) : null;
  const dateRange = endDate
    ? `${monthName} ${day}-${endDate.getUTCDate()}, ${year}`
    : shortDate;

  const CtaButton = ({ label, style: s }: { label?: string; style?: React.CSSProperties }) => (
    isSoldOut ? (
      <button className="btn-accent" style={s} onClick={() => setShowWaitlist(true)}>{label || 'Join the Waitlist'}</button>
    ) : (
      <a href={ctaUrl} className="btn-accent" style={s} target="_blank" rel="noopener noreferrer">{label || `Reserve Your Seat — $${price}`}</a>
    )
  );

  return (
    <div style={{ position: 'relative' }}>
      <ParticleBackground />

      {/* URGENCY BANNER */}
      <div className="urgency-banner">
        <span style={{ marginRight: 8 }}>{'\u{25CF}'}</span>
        LIVE Workshop — {dateRange} — Only {seatsLeft} of {event.capacity} seats remain
      </div>

      {/* ===== HERO ===== */}
      <section style={{ padding: '100px 20px 70px', textAlign: 'center', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,58,237,0.1)', border: '1px solid rgba(108,58,237,0.3)', padding: '8px 20px', borderRadius: 100, marginBottom: 28, fontSize: 14, fontWeight: 600, color: 'var(--accent-light)' }}>
          Night Vibe — AI App Development
        </div>

        <h1 style={{ fontSize: 'clamp(34px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 24, letterSpacing: '-0.03em' }} className="gradient-text">
          {event.title}
        </h1>

        <p style={{ fontSize: 'clamp(17px, 2.2vw, 21px)', color: 'var(--text-secondary)', maxWidth: 700, margin: '0 auto 32px', lineHeight: 1.65 }}>
          {event.subtitle}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24, marginBottom: 28, fontSize: 15, color: 'var(--text-secondary)' }}>
          <span>{'\u{1F4C5}'} {dateRange}</span>
          <span>{'\u{1F550}'} {formattedTime} {displayTimezone}</span>
          <span>{'\u{1F4BB}'} Live Virtual</span>
          <span style={{ fontWeight: 700, color: 'white' }}>${price}</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div className="seat-counter">
            <span className="seat-dot" />
            {isSoldOut ? 'SOLD OUT — Join Waitlist' : `Only ${seatsLeft} of ${event.capacity} seats left`}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
          <CtaButton />
          {!isSoldOut && (
            <button className="btn-secondary" onClick={() => setShowWaitlist(true)}>Join the Waitlist</button>
          )}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Live workshop. {event.capacity} seats only. Recording included. Designed for business owners, not developers.
        </p>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The problem</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 36, lineHeight: 1.2 }}>
            You know AI can change your business.<br />
            <span style={{ color: 'var(--text-secondary)' }}>You just have not found the right way in.</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { icon: '\u{1F504}', title: 'Drowning in manual work', desc: 'You are doing the same tasks by hand every week. Things that should be automated are eating your hours and killing your margins.', glow: 'purple' },
              { icon: '\u{1F4B8}', title: 'Paying for too many tools', desc: 'Your tech stack costs hundreds per month. Half the features go unused. You know you could build something better and cheaper.', glow: 'teal' },
              { icon: '\u{1F636}', title: 'AI feels overwhelming', desc: 'You see the potential but every course is theory-heavy, developer-focused, or too broad to be useful for your specific business.', glow: 'purple' },
              { icon: '\u{1F4A1}', title: 'Ideas that never launch', desc: 'You have had the app idea for months. Maybe years. But hiring a developer costs $10K-$50K and you are not sure it will even work.', glow: 'teal' },
              { icon: '\u{23F3}', title: 'Falling behind competitors', desc: 'Every month you wait, someone else in your industry is automating, building, and pulling ahead. The gap is growing.', glow: 'purple' },
              { icon: '\u{1F6AB}', title: 'Do not want to learn code', desc: 'You are a business builder, not a programmer. You need a practical path that works with your skills, not against them.', glow: 'teal' },
            ].map((item, i) => (
              <div key={i} className={`card card-glow-${item.glow}`} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
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

      {/* ===== TRANSFORMATION ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The transformation</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>
          Walk in with a problem. Walk out with a working app.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, textAlign: 'left' }}>Before the workshop</h3>
            {['Stuck with ideas that never move forward', 'Paying for fragmented SaaS tools', 'Manual processes eating your time', 'Confused about where to start with AI', 'Dependent on expensive developers', 'No clear path from idea to revenue'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 15, color: 'var(--text-secondary)', textAlign: 'left' }}>
                <span style={{ color: '#EF4444', flexShrink: 0 }}>{'\u{2716}'}</span>{item}
              </div>
            ))}
          </div>
          <div className="card" style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.02)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20, textAlign: 'left' }}>After the workshop</h3>
            {['A working app deployed and live on the web', 'A clearer offer tied to real business outcomes', 'Skills to build more apps on your own', 'A system that saves time or generates revenue', 'Full ownership of your code and product', 'Confidence to execute with modern AI tools'].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 15, color: 'var(--text-secondary)', textAlign: 'left' }}>
                <span style={{ color: '#10B981', flexShrink: 0 }}>{'\u{2714}'}</span>{item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 40 }}><CtaButton /></div>
      </section>

      {/* ===== WHY THIS IS DIFFERENT ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Why this is different</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>This is not a course. This is a build sprint.</h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650, margin: '0 auto 40px' }}>You do not sit and watch. You open your laptop, follow along live, and walk out with something real.</p>
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
                {[['Format', 'Pre-recorded videos', 'Live, guided build sessions'], ['Outcome', 'Knowledge (maybe)', 'A deployed, working app'], ['Support', 'Community forum', `${event.capacity}-person live Q&A`], ['Duration', 'Weeks or months', '2 days, 8 hours total'], ['Focus', 'Broad AI theory', 'Your specific business problem'], ['Tools', 'Outdated or generic', 'Claude + Supabase + Vercel (2026 stack)'], ['After the event', 'You are on your own', 'Community + future sessions included']].map(([f, t, o], i) => (
                  <tr key={i}><td style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'left' }}>{f}</td><td style={{ color: 'var(--text-muted)', textAlign: 'left' }}>{t}</td><td style={{ color: 'var(--success)', fontWeight: 500, textAlign: 'left' }}>{o}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== WHAT YOU WILL BUILD ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>What you will build</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>Real apps. Real revenue. Real time savings.</h2>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 650, margin: '0 auto 40px' }}>You do not need the perfect idea before joining. The workshop helps you identify the right use case.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { icon: '\u{1F6E0}', title: 'Internal Tools', glow: 'purple' },
            { icon: '\u{1F465}', title: 'Customer Portals', glow: 'teal' },
            { icon: '\u{1F3AF}', title: 'Lead Gen Tools', glow: 'purple' },
            { icon: '\u{26A1}', title: 'Automation', glow: 'teal' },
            { icon: '\u{1F4B0}', title: 'Micro-SaaS', glow: 'purple' },
          ].map((item, i) => (
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

      {/* ===== ANIMATED ROADMAP ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Your journey</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>From idea to live app in 4 steps</h2>

          <div className="roadmap">
            {[
              { num: '01', icon: '\u{1F4DD}', title: 'Register & Prep', desc: 'Secure your seat, set up your free accounts, and arrive with your business problem ready to solve.', color: '#8B5CF6' },
              { num: '02', icon: '\u{1F4A1}', title: 'Define Your App', desc: 'Use our 3-Step AI Blueprint to turn your idea into a clear architecture. No code needed.', color: '#6366F1' },
              { num: '03', icon: '\u{1F528}', title: 'Build It Live', desc: 'Follow along step-by-step as you use Claude, Supabase, and Vercel to build your real app.', color: '#2DD4BF' },
              { num: '04', icon: '\u{1F389}', title: 'Deploy & Launch', desc: 'Push your app live. It works. People can use it. You own the code forever.', color: '#22D3EE' },
            ].map((step, i) => (
              <div key={i} className="roadmap-step">
                {i < 3 && <div className="roadmap-line" />}
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

      {/* ===== REVENUE CALCULATOR ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Revenue potential</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>See what your app could generate</h2>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 600, margin: '0 auto 48px' }}>Adjust the numbers to match your market. Even a small app can pay for this workshop many times over.</p>
        <RevenueCalculator workshopPrice={price} ctaUrl={ctaUrl} isSoldOut={isSoldOut} onWaitlist={() => setShowWaitlist(true)} />
      </section>

      {/* ===== TOOL STACK ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>The tool stack</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 16, lineHeight: 1.2 }}>Modern tools. Minimal cost. Maximum power.</h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 48, maxWidth: 650, margin: '0 auto 48px' }}>Everything is beginner-friendly and guided live during the workshop. Some tools are optional — the essentials are free or under $20/mo.</p>

          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--success)', marginBottom: 20 }}>Required</p>
          <div className="tool-row" style={{ marginBottom: 40 }}>
            {[{ name: 'Claude', cost: '$20/mo', emoji: '\u{1F916}', desc: 'Your AI building partner' }, { name: 'Supabase', cost: 'Free', emoji: '\u{26A1}', desc: 'Database & auth' }, { name: 'Vercel', cost: 'Free', emoji: '\u{25B2}', desc: 'Hosting & deploy' }].map((tool, i) => (
              <div key={i} className="tool-item">
                <div className="tool-icon">{tool.emoji}</div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{tool.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: tool.cost === 'Free' ? 'var(--success)' : 'var(--accent-light)' }}>{tool.cost}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tool.desc}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 20 }}>Optional (recommended)</p>
          <div className="tool-row" style={{ marginBottom: 32 }}>
            {[{ name: 'Emergent Labs', cost: '$20/mo', emoji: '\u{1F52C}', desc: 'AI dev tools' }, { name: 'Gemini', cost: 'Free', emoji: '\u{2B50}', desc: 'Supporting AI' }, { name: 'Gamma', cost: 'Free', emoji: '\u{1F3A8}', desc: 'Presentations' }].map((tool, i) => (
              <div key={i} className="tool-item" style={{ opacity: 0.75 }}>
                <div className="tool-icon">{tool.emoji}</div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{tool.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: tool.cost === 'Free' ? 'var(--success)' : 'var(--accent-light)' }}>{tool.cost}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tool.desc}</span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 550, margin: '0 auto' }}>Total budget: about <span style={{ fontWeight: 700, color: 'white' }}>$20-$50/month</span>. Most tools are free. We walk through every setup step live.</p>
        </div>
      </section>

      {/* ===== OFFER STACK ===== */}
      <section className="section">
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Everything included</p>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>This is not just a workshop. It is a full implementation package.</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {(offerItems.length > 0 ? offerItems : [
            { icon: '🎬', title: 'Live 2-Day Build Sprint', description: '8 hours of guided, hands-on building. Not lectures — execution.', glow: 'purple', is_bonus: false },
            { icon: '💻', title: 'Your Functional App', description: 'Walk away with a real, deployed application. Not a mockup — a live app.', glow: 'teal', is_bonus: false },
            { icon: '🎥', title: 'Full Recording Access', description: 'Every session recorded. Revisit any step anytime you build your next app.', glow: 'purple', is_bonus: false },
            { icon: '📝', title: 'Complete SOPs & Procedures', description: 'Step-by-step documentation for every technique. Your permanent reference.', glow: 'teal', is_bonus: false },
            { icon: '📚', title: 'The 3-Step AI App Blueprint', description: 'Our proprietary framework from business problem to working app.', glow: 'purple', is_bonus: false },
            { icon: '👥', title: 'Community Access', description: 'Join builders who share resources, ask questions, and grow together.', glow: 'teal', is_bonus: false },
            { icon: '🔄', title: '3 Bonus Future Sessions', description: 'Access to 3 additional workshop sessions. Build more apps, keep growing.', glow: 'purple', is_bonus: false },
            { icon: '⭐', title: `${event.capacity}-Person Q&A`, description: 'Small cohort = personal attention. Your questions answered in real time.', glow: 'teal', is_bonus: false },
            { icon: '🚀', title: 'Launch Accelerator Tool', description: 'Custom AI app to guide your build and launch — FREE early access for attendees.', glow: 'teal', is_bonus: true },
          ] as { icon: string; title: string; description: string; glow: string; is_bonus: boolean }[]).filter(item => !item.is_bonus).map((item, i) => (
            <div key={i} className={`card card-glow-${item.glow}`} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', textAlign: 'left' }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BONUS ITEMS — rendered dynamically from DB */}
        {(offerItems.length > 0 ? offerItems : []).filter(item => item.is_bonus).map((bonusItem, bi) => (
          <div key={bi} className="bonus-card" style={{ marginTop: 40, maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2, background: 'rgba(245,197,66,0.1)', padding: '6px 16px', borderRadius: 100, border: '1px solid rgba(245,197,66,0.3)' }}>{'\u{1F381}'} Exclusive Bonus</span>
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

      {/* ===== WHO THIS IS FOR ===== */}
      <section className="section-dark">
        <div className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Is this right for you</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>This workshop is built for a specific kind of person</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, textAlign: 'left' }}>
            <div className="card card-glow-teal" style={{ borderColor: 'rgba(16,185,129,0.25)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', marginBottom: 20 }}>This is for you if...</h3>
              {['You already run a business or have a clear offer', 'You want to replace software tools or build a new revenue stream', 'You are ready to execute live, not just watch', 'You want a working app, not more theory', 'You are comfortable using AI tools and following guidance', 'You want to move fast and build something real this month'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}><span style={{ color: 'var(--success)', flexShrink: 0, fontWeight: 700 }}>{'\u{2714}'}</span><span style={{ color: 'var(--text-secondary)' }}>{item}</span></div>
              ))}
            </div>
            <div className="card card-glow-purple" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--danger)', marginBottom: 20 }}>This is not for you if...</h3>
              {['You just want to learn about AI without building anything', 'You are looking for a passive video course', 'You are not willing to show up live for both days', 'You do not have a business problem or idea to work on', 'You expect someone else to build your app for you', 'You are looking for the cheapest option, not the best outcome'].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}><span style={{ color: 'var(--danger)', flexShrink: 0, fontWeight: 700 }}>{'\u{2716}'}</span><span style={{ color: 'var(--text-secondary)' }}>{item}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOSTS / SPEAKERS ===== */}
      {hosts.length > 0 && (
        <section className="section">
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
            {hosts.length > 1 ? 'Your hosts' : 'Your instructor'}
          </p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, marginBottom: 48, lineHeight: 1.2 }}>
            {hosts.length > 1 ? 'Learn from industry leaders' : 'Meet your instructor'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 48, maxWidth: 960, margin: '0 auto' }}>
            {hosts.map((eh, idx) => {
              const host = eh.hosts;
              const isFirst = idx === 0;
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
              );
            })}
          </div>
        </section>
      )}

      {/* ===== PRICING ===== */}
      <section className={hosts.length > 0 ? 'section-dark' : 'section'} id="pricing">
        <div className="section" style={{ maxWidth: 560, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Reserve your seat</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 8 }}>${price}</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32 }}>One-time investment. Lifetime access to recordings and community.</p>

          <div className="card glow-ring" style={{ textAlign: 'left', borderColor: 'var(--accent)', padding: 36, marginBottom: 24 }}>
            {(offerItems.length > 0 ? offerItems : [
              { icon: '🎬', title: `Live 2-day build sprint (${dateRange})`, is_bonus: false },
              { icon: '🕒', title: `${formattedTime} ${displayTimezone} each day`, is_bonus: false },
              { icon: '💻', title: 'Functional app built and deployed', is_bonus: false },
              { icon: '🎥', title: 'Full recording access', is_bonus: false },
              { icon: '📝', title: 'SOPs, blueprints, and training docs', is_bonus: false },
              { icon: '👥', title: 'Community access', is_bonus: false },
              { icon: '🔄', title: '3 bonus future workshop sessions', is_bonus: false },
              { icon: '⭐', title: `${event.capacity}-person intimate cohort with live Q&A`, is_bonus: false },
              { icon: '🚀', title: 'BONUS: Launch Accelerator Tool (FREE early access)', is_bonus: true },
            ] as { icon: string; title: string; is_bonus: boolean }[]).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, fontSize: 15 }}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontWeight: item.is_bonus ? 700 : 400, color: item.is_bonus ? 'var(--gold)' : 'inherit' }}>{item.is_bonus ? `BONUS: ${item.title}` : item.title}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0', paddingTop: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Special Offer</p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>Bring 3 employees or 3 friends and your session is free.</p>
            </div>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div className="seat-counter" style={{ marginBottom: 20, justifyContent: 'center', width: '100%' }}><span className="seat-dot" />{isSoldOut ? 'SOLD OUT' : `${seatsLeft} of ${event.capacity} seats remaining`}</div>
              {isSoldOut ? (<button className="btn-accent" style={{ width: '100%' }} onClick={() => setShowWaitlist(true)}>Join the Waitlist</button>) : (<a href={ctaUrl} className="btn-accent" style={{ width: '100%', display: 'block' }} target="_blank" rel="noopener noreferrer">Reserve Your Seat — ${price}</a>)}
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Secure checkout via Stripe. Instant confirmation. Calendar invite sent within minutes.</p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className={hosts.length > 0 ? 'section' : 'section-dark'}>
        <div className="section" style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Questions</p>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 700, marginBottom: 40, lineHeight: 1.2 }}>Frequently asked questions</h2>
          {[
            { q: 'Do I need to know how to code?', a: 'No. This workshop is designed for business owners and non-developers. You will use AI tools to build your app with guided, step-by-step instructions.' },
            { q: 'What kind of app can I build?', a: 'Internal tools, customer-facing products, lead generation tools, workflow automation, or even a paid micro-SaaS. The workshop helps you identify the right use case.' },
            { q: 'What if I do not have my idea yet?', a: 'That is completely fine. The workshop includes a framework for identifying the best app opportunity for your business.' },
            { q: 'Will I really finish with something functional?', a: 'Yes. You build and deploy a working app by the end of Day 2. It will be live on the internet, functional, and yours to keep.' },
            { q: 'What tools do I need?', a: 'A computer with internet access. Claude ($20/mo), Supabase (free), Vercel (free). Optional: Emergent Labs ($20/mo), Gemini (free). Total: $20-$50/month.' },
            { q: 'Is the recording included?', a: 'Yes. Full recordings of both days are included. Rewatch any section anytime.' },
            { q: 'What if the workshop sells out?', a: 'Join the waitlist. All future sessions are included with your purchase when you do register.' },
            { q: 'Can I bring my team?', a: 'Yes. Bring 3 employees or 3 friends and your seat is free. Each person needs their own device.' },
            { q: 'What is the Launch Accelerator Tool?', a: 'A bonus AI-powered tool exclusively for attendees. It guides you through the most thorough and effective app launch process — your personal launch checklist on steroids.' },
          ].map((item, i) => (
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

      {/* ===== FINAL CTA ===== */}
      <section className="section" style={{ paddingBottom: 120 }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }} className="gradient-text">Two days from now, you could have a working app.</h2>
        <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 12, maxWidth: 600, margin: '0 auto 12px' }}>{dateRange}. {formattedTime} {displayTimezone}. {event.capacity} seats only.</p>
        <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 28 }}>${price}</p>
        <div className="seat-counter" style={{ marginBottom: 28 }}><span className="seat-dot" />{isSoldOut ? 'SOLD OUT — Join Waitlist Below' : `${seatsLeft} seats remaining — these will go fast`}</div>
        <div style={{ marginBottom: 16 }}><CtaButton /></div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>Secure checkout. Instant access. Recording included.</p>
        <div style={{ marginTop: 48, paddingTop: 48, borderTop: '1px solid var(--border)' }}><p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Night Vibe — AI App Development Company</p></div>
      </section>

      {/* STICKY CTA */}
      <div className={`sticky-cta ${showSticky ? 'visible' : ''}`}>
        <div className="seat-counter" style={{ fontSize: 13 }}><span className="seat-dot" />{seatsLeft} seats left</div>
        {isSoldOut ? (<button className="btn-accent btn-accent-sm" onClick={() => setShowWaitlist(true)}>Join Waitlist</button>) : (<a href={ctaUrl} className="btn-accent btn-accent-sm" target="_blank" rel="noopener noreferrer">Reserve Your Seat — ${price}</a>)}
      </div>

      {/* WAITLIST MODAL */}
      {showWaitlist && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowWaitlist(false) }}>
          <div className="modal-content">
            {waitlistSubmitted ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{2705}'}</div>
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
                  <button type="submit" className="btn-accent" style={{ width: '100%' }} disabled={submittingWaitlist}>{submittingWaitlist ? 'Joining...' : 'Get Notified'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
