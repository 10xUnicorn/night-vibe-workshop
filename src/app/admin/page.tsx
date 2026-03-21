'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface EventRow {
  id: string
  title: string
  slug: string
  subtitle: string
  event_type: string
  start_date: string
  end_date: string
  timezone: string
  capacity: number
  status: string
  is_featured: boolean
  stripe_payment_link: string
  landing_page_data: Record<string, unknown>
  event_tickets: { id: string; sold_count: number; capacity: number; price: number; status: string; stripe_payment_link: string }[]
  created_at: string
}

interface WaitlistRow {
  id: string
  event_id: string
  name: string
  email: string
  company: string | null
  created_at: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [events, setEvents] = useState<EventRow[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([])
  const [tab, setTab] = useState<'events' | 'waitlist' | 'create'>('events')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // New event form
  const [form, setForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    start_date: '',
    end_date: '',
    timezone: 'America/Los_Angeles',
    capacity: 20,
    stripe_payment_link: '',
    price: 997,
    is_featured: false,
    special_offer: '',
    instructor_name: 'Daniel Knight',
    company_name: 'Night Vibe',
  })

  const fetchData = useCallback(async () => {
    // Fetch events with service-level access by using the anon key
    // Admin reads all events regardless of status
    const { data: evts } = await supabase
      .from('events')
      .select('*, event_tickets(*)')
      .order('start_date', { ascending: false })

    if (evts) setEvents(evts as EventRow[])

    const { data: wl } = await supabase
      .from('waitlist_signups')
      .select('*')
      .order('created_at', { ascending: false })

    if (wl) setWaitlist(wl as WaitlistRow[])
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
    } else {
      setMsg('Incorrect password')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password }),
      })

      if (res.ok) {
        setMsg('Event created successfully')
        setForm({ ...form, title: '', slug: '', subtitle: '', start_date: '', end_date: '', stripe_payment_link: '', is_featured: false, special_offer: '' })
        fetchData()
        setTab('events')
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to create event')
      }
    } catch {
      setMsg('Network error')
    }
    setSaving(false)
  }

  const updateEventStatus = async (eventId: string, status: string) => {
    const res = await fetch('/api/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId, status, password }),
    })
    if (res.ok) fetchData()
  }

  const toggleFeatured = async (eventId: string, currentVal: boolean) => {
    const res = await fetch('/api/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId, is_featured: !currentVal, password }),
    })
    if (res.ok) fetchData()
  }

  const updateSoldCount = async (ticketId: string, newCount: number) => {
    const res = await fetch('/api/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, sold_count: newCount, password }),
    })
    if (res.ok) fetchData()
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', padding: 20 }}>
        <div style={{ maxWidth: 400, width: '100%' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Admin Access</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>Night Vibe Workshop Management</p>
          <form onSubmit={handleLogin}>
            <input
              className="admin-input"
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: 14 }}
            />
            <button type="submit" className="admin-btn" style={{ width: '100%' }}>Enter</button>
          </form>
          {msg && <p style={{ color: 'var(--danger)', fontSize: 14, marginTop: 12, textAlign: 'center' }}>{msg}</p>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Night Vibe Admin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage workshops, events, and waitlist</p>
          </div>
          <a href="/" style={{ fontSize: 13, color: 'var(--accent-light)', textDecoration: 'none' }}>&#8592; View landing page</a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 2 }}>
          {(['events', 'waitlist', 'create'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setMsg('') }} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', textTransform: 'capitalize'
            }}>
              {t === 'create' ? 'Create Event' : t} {t === 'events' ? `(${events.length})` : t === 'waitlist' ? `(${waitlist.length})` : ''}
            </button>
          ))}
        </div>

        {msg && <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, background: msg.includes('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.includes('success') ? 'var(--success)' : 'var(--danger)', fontSize: 14, fontWeight: 500 }}>{msg}</div>}

        {/* EVENTS TAB */}
        {tab === 'events' && (
          <div>
            {events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No events yet. Create your first one.</p>
            ) : (
              events.map((ev) => {
                const ticket = ev.event_tickets?.[0]
                const sold = ticket?.sold_count || 0
                const cap = ticket?.capacity || ev.capacity
                return (
                  <div key={ev.id} className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 17, fontWeight: 700 }}>{ev.title}</h3>
                          {ev.is_featured && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--accent)', color: 'white', fontWeight: 600 }}>FEATURED</span>}
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: ev.status === 'published' ? 'rgba(16,185,129,0.2)' : ev.status === 'sold_out' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: ev.status === 'published' ? 'var(--success)' : ev.status === 'sold_out' ? 'var(--danger)' : 'var(--warning)', fontWeight: 600, textTransform: 'uppercase' }}>{ev.status}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                          {new Date(ev.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — {ev.timezone}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Slug: /{ev.slug}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-light)' }}>{sold}/{cap}</div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>seats sold</p>
                        {ticket && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                            <button onClick={() => updateSoldCount(ticket.id, Math.max(0, sold - 1))} className="admin-btn" style={{ padding: '4px 10px', fontSize: 13 }}>-</button>
                            <button onClick={() => updateSoldCount(ticket.id, Math.min(cap, sold + 1))} className="admin-btn" style={{ padding: '4px 10px', fontSize: 13 }}>+</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                      <button onClick={() => toggleFeatured(ev.id, ev.is_featured)} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: ev.is_featured ? 'var(--warning)' : 'var(--border)', color: ev.is_featured ? '#000' : 'var(--text-secondary)' }}>
                        {ev.is_featured ? 'Remove Featured' : 'Set Featured'}
                      </button>
                      {ev.status === 'draft' && <button onClick={() => updateEventStatus(ev.id, 'published')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--success)' }}>Publish</button>}
                      {ev.status === 'published' && <button onClick={() => updateEventStatus(ev.id, 'sold_out')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--danger)' }}>Mark Sold Out</button>}
                      {ev.status === 'sold_out' && <button onClick={() => updateEventStatus(ev.id, 'published')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--success)' }}>Reopen</button>}
                      {ev.status !== 'cancelled' && <button onClick={() => updateEventStatus(ev.id, 'cancelled')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>Cancel</button>}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* WAITLIST TAB */}
        {tab === 'waitlist' && (
          <div>
            {waitlist.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No waitlist signups yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Company</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px' }}>{w.name}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--accent-light)' }}>{w.email}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{w.company || '—'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* CREATE EVENT TAB */}
        {tab === 'create' && (
          <form onSubmit={handleCreate} style={{ maxWidth: 600 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Event Title</label>
                <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Build & Launch Your AI App..." />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>URL Slug</label>
                <input className="admin-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="ai-app-workshop-may-2026" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Subtitle</label>
                <input className="admin-input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="In this live 2-day workshop..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Start Date/Time</label>
                  <input className="admin-input" type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>End Date/Time</label>
                  <input className="admin-input" type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Price ($)</label>
                  <input className="admin-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Capacity</label>
                  <input className="admin-input" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Timezone</label>
                  <select className="admin-input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                    <option value="America/Los_Angeles">Pacific</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/New_York">Eastern</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stripe Payment Link</label>
                <input className="admin-input" value={form.stripe_payment_link} onChange={(e) => setForm({ ...form, stripe_payment_link: e.target.value })} placeholder="https://buy.stripe.com/..." />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Special Offer</label>
                <input className="admin-input" value={form.special_offer} onChange={(e) => setForm({ ...form, special_offer: e.target.value })} placeholder="Bring 3 friends and your session is free" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="featured" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                <label htmlFor="featured" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Set as featured event (shown on landing page)</label>
              </div>
              <button type="submit" className="admin-btn" style={{ padding: '14px', fontSize: 16 }} disabled={saving}>
                {saving ? 'Creating...' : 'Create Event & Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
