'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Host {
  id: string
  name: string
}

interface EventHost {
  host_id: string
  event_id: string
}

interface EventTicket {
  id: string
  price: number
  sold_count: number
  capacity: number
  stripe_payment_link: string
}

interface Event {
  id: string
  title: string
  slug: string
  subtitle: string
  start_date: string
  end_date: string
  timezone: string
  capacity: number
  status: string
  theme: string
  stripe_payment_link: string
  event_tickets: EventTicket[]
}

interface ProcessedEvent extends Event {
  host_names: string[]
  price: number
  seats_remaining: number
}

export default function EventsPage() {
  const [events, setEvents] = useState<ProcessedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch events with tickets
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*, event_tickets(*)')
          .in('status', ['published', 'sold_out'])
          .eq('is_public', true)
          .gte('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })

        if (eventsError) throw eventsError

        // Fetch event_hosts join data
        const { data: eventHostsData, error: eventHostsError } = await supabase
          .from('event_hosts')
          .select('*')

        if (eventHostsError) throw eventHostsError

        // Fetch all hosts
        const { data: hostsData, error: hostsError } = await supabase
          .from('hosts')
          .select('*')

        if (hostsError) throw hostsError

        // Process events and attach host names
        const processedEvents: ProcessedEvent[] = (eventsData || []).map(
          (event: Event) => {
            const eventHostIds = (eventHostsData || [])
              .filter((eh: EventHost) => eh.event_id === event.id)
              .map((eh: EventHost) => eh.host_id)

            const host_names = eventHostIds
              .map(
                (hostId: string) =>
                  (hostsData || []).find((h: Host) => h.id === hostId)?.name
              )
              .filter((name): name is string => !!name)

            const ticket = event.event_tickets?.[0]
            const price = ticket?.price || 0
            const seats_remaining = Math.max(0, event.capacity - (ticket?.sold_count || 0))

            return {
              ...event,
              host_names,
              price,
              seats_remaining,
            }
          }
        )

        setEvents(processedEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const formatDate = (dateString: string): string => {
    const d = new Date(dateString)
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const h = d.getUTCHours()
    const m = d.getUTCMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${days[d.getUTCDay()]}, ${months[d.getUTCMonth()]} ${d.getUTCDate()} · ${h12}:${m.toString().padStart(2,'0')} ${ampm}`
  }

  const formatTimezone = (tz: string): string => {
    const map: Record<string, string> = {
      'America/Los_Angeles': 'Pacific', 'America/Denver': 'Mountain',
      'America/Chicago': 'Central', 'America/New_York': 'Eastern',
      'US/Pacific': 'Pacific', 'US/Eastern': 'Eastern', 'UTC': 'UTC',
    }
    return map[tz] || tz?.replace(/_/g, ' ').replace(/^.*\//, '') || ''
  }

  const getThemeAccent = (theme: string): string => {
    const themes: { [key: string]: string } = {
      purple: 'var(--accent-light)',
      teal: 'var(--teal)',
      cyan: 'var(--cyan)',
      gold: 'var(--gold)',
    }
    return themes[theme] || 'var(--accent-light)'
  }

  const getThemeBorder = (theme: string): string => {
    const themes: { [key: string]: string } = {
      purple: 'rgba(108, 58, 237, 0.3)',
      teal: 'rgba(45, 212, 191, 0.25)',
      cyan: 'rgba(34, 211, 238, 0.25)',
      gold: 'rgba(245, 197, 66, 0.3)',
    }
    return themes[theme] || 'rgba(108, 58, 237, 0.3)'
  }

  const getThemeGlow = (theme: string): string => {
    const themes: { [key: string]: string } = {
      purple: '0 0 40px rgba(108, 58, 237, 0.08), inset 0 1px 0 rgba(108, 58, 237, 0.15)',
      teal: '0 0 40px rgba(45, 212, 191, 0.06), inset 0 1px 0 rgba(45, 212, 191, 0.12)',
      cyan: '0 0 40px rgba(34, 211, 238, 0.08), inset 0 1px 0 rgba(34, 211, 238, 0.15)',
      gold: '0 0 40px rgba(245, 197, 66, 0.08), inset 0 1px 0 rgba(245, 197, 66, 0.15)',
    }
    return themes[theme] || '0 0 40px rgba(108, 58, 237, 0.08), inset 0 1px 0 rgba(108, 58, 237, 0.15)'
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-dark)',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* HEADER SECTION */}
      <section
        style={{
          padding: '80px 20px 60px',
          textAlign: 'center',
          maxWidth: 900,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(108,58,237,0.1)',
            border: '1px solid rgba(108,58,237,0.3)',
            padding: '8px 20px',
            borderRadius: 100,
            marginBottom: 28,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--accent-light)',
          }}
        >
          Night Vibe — Upcoming Events
        </div>

        <h1
          style={{
            fontSize: 'clamp(34px, 5vw, 56px)',
            fontWeight: 800,
            lineHeight: 1.08,
            marginBottom: 16,
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, var(--accent-light), var(--teal))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Upcoming Events
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2.2vw, 19px)',
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto 32px',
            lineHeight: 1.65,
          }}
        >
          Join live workshops to build AI apps, master new tools, and connect with our community.
        </p>
      </section>

      {/* EVENTS GRID */}
      {events.length > 0 ? (
        <section
          style={{
            padding: '0 20px 80px',
            maxWidth: 1200,
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {events.map((event) => (
              <div
                key={event.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${getThemeBorder(event.theme)}`,
                  borderRadius: 16,
                  padding: 28,
                  transition: 'all 0.4s ease',
                  backdropFilter: 'blur(12px)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: getThemeGlow(event.theme),
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.background = 'var(--bg-card-hover)'
                  el.style.borderColor = getThemeAccent(event.theme)
                  el.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.background = 'var(--bg-card)'
                  el.style.borderColor = getThemeBorder(event.theme)
                  el.style.transform = 'translateY(0)'
                }}
              >
                {/* THEME ACCENT BAR */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: getThemeAccent(event.theme),
                    borderRadius: '16px 16px 0 0',
                  }}
                />

                {/* TITLE */}
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 12,
                    marginTop: 12,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {event.title}
                </h3>

                {/* SUBTITLE */}
                {event.subtitle && (
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      marginBottom: 16,
                      lineHeight: 1.5,
                    }}
                  >
                    {event.subtitle}
                  </p>
                )}

                {/* DATE & TIME */}
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span>📅</span>
                  {formatDate(event.start_date)}
                </div>

                {/* TIMEZONE */}
                {event.timezone && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginBottom: 16,
                    }}
                  >
                    {formatTimezone(event.timezone)} Time
                  </div>
                )}

                {/* HOSTS */}
                {event.host_names.length > 0 && (
                  <div
                    style={{
                      fontSize: 13,
                      color: getThemeAccent(event.theme),
                      marginBottom: 16,
                      fontWeight: 500,
                    }}
                  >
                    Hosted by {event.host_names.join(', ')}
                  </div>
                )}

                {/* SPACER */}
                <div style={{ flex: 1 }} />

                {/* SOLD OUT BADGE */}
                {event.seats_remaining === 0 && (
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--danger)',
                      marginBottom: 16,
                    }}
                  >
                    SOLD OUT
                  </div>
                )}

                {/* PRICE & SEATS */}
                <div
                  style={{
                    marginBottom: 16,
                    paddingTop: 16,
                    borderTop: `1px solid ${getThemeBorder(event.theme)}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Price:</span>
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: getThemeAccent(event.theme),
                      }}
                    >
                      ${event.price}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Seats:</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: event.seats_remaining > 0 ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {event.seats_remaining > 0
                        ? `${event.seats_remaining} left`
                        : 'Sold out'}
                    </span>
                  </div>
                </div>

                {/* CTA BUTTONS */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link
                    href={`/events/${event.slug}`}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      color: 'var(--accent-light)',
                      fontWeight: 700,
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: '2px solid rgba(108, 58, 237, 0.4)',
                      fontSize: 14,
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'block',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(108, 58, 237, 0.08)'
                      e.currentTarget.style.borderColor = 'var(--accent-light)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'rgba(108, 58, 237, 0.4)'
                    }}
                  >
                    View
                  </Link>
                  {event.seats_remaining > 0 ? (
                    <a
                      href={event.stripe_payment_link || event.event_tickets?.[0]?.stripe_payment_link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                        color: 'white',
                        fontWeight: 700,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: 'none',
                        fontSize: 14,
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'block',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(108, 58, 237, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      Register
                    </a>
                  ) : (
                    <Link
                      href={`/events/${event.slug}?waitlist=true`}
                      style={{
                        flex: 1,
                        background: 'rgba(108, 58, 237, 0.15)',
                        color: 'var(--accent-light)',
                        fontWeight: 700,
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontSize: 14,
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'block',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(108, 58, 237, 0.25)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(108, 58, 237, 0.15)'
                      }}
                    >
                      Join Waitlist
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* NO EVENTS MESSAGE */
        <section
          style={{
            padding: '80px 20px',
            textAlign: 'center',
            maxWidth: 600,
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-glow)',
              borderRadius: 16,
              padding: 48,
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 12,
                color: 'var(--text-primary)',
              }}
            >
              No Upcoming Events
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'var(--text-secondary)',
                marginBottom: 28,
                lineHeight: 1.6,
              }}
            >
              We are currently planning our next workshop. Get notified when new events are scheduled.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              <button
                className="btn-accent"
                onClick={() => {
                  const email = prompt('Enter your email to join the waitlist:')
                  if (email) {
                    console.log('Waitlist signup:', email)
                  }
                }}
                style={{
                  cursor: 'pointer',
                }}
              >
                Join the Waitlist
              </button>
              <Link
                href="/"
                style={{
                  background: 'transparent',
                  color: 'var(--accent-light)',
                  fontWeight: 600,
                  padding: '14px 36px',
                  borderRadius: 12,
                  border: '2px solid rgba(108, 58, 237, 0.5)',
                  fontSize: 16,
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(108, 58, 237, 0.08)'
                  e.currentTarget.style.borderColor = 'var(--accent-light)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(108, 58, 237, 0.5)'
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
