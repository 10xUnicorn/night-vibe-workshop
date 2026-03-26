'use client'

import { useEffect, useState, useCallback } from 'react'

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
  is_public?: boolean
  theme?: string
  stripe_payment_link: string
  stripe_product_id: string
  landing_page_data: Record<string, unknown>
  event_tickets: { id: string; sold_count: number; capacity: number; price: number; status: string; stripe_payment_link: string; stripe_product_id: string; stripe_price_id: string }[]
  created_at: string
}

interface WaitlistRow {
  id: string
  event_id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  created_at: string
}

interface RegistrationRow {
  id: string
  event_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  amount_paid: number
  currency: string
  product_name: string
  status: string
  created_at: string
}

interface HostRow {
  id: string
  name: string
  title: string
  company: string
  short_description: string
  bio: string
  headshot_url: string
  promo_graphic_url: string
  category: string
  is_featured: boolean
  social_links: Record<string, string>
  stat1_value: string
  stat1_label: string
  stat2_value: string
  stat2_label: string
  stat3_value: string
  stat3_label: string
  created_at: string
}

interface EventHostRow {
  id: string
  event_id: string
  host_id: string
  role: string
  display_order: number
}

interface OfferItemRow {
  id: string
  icon: string
  title: string
  description: string
  glow: string
  is_bonus: boolean
  display_order: number
  featured_image_url: string
  bonus_description: string
  bonus_tags: string[]
  created_at: string
}

interface EventOfferItemRow {
  id: string
  event_id: string
  offer_item_id: string
  display_order: number
}

interface GuaranteeRow {
  id: string
  title: string
  description: string
  icon: string
  badge_text: string
  fine_print: string
  is_active: boolean
  created_at: string
}

interface EventGuaranteeRow {
  id: string
  event_id: string
  guarantee_id: string
  display_order: number
}

interface ContactSubmissionRow {
  id: string
  name: string
  email: string
  message: string
  event_id: string | null
  created_at: string
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [events, setEvents] = useState<EventRow[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistRow[]>([])
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([])
  const [hosts, setHosts] = useState<HostRow[]>([])
  const [eventHosts, setEventHosts] = useState<EventHostRow[]>([])
  const [offerItems, setOfferItems] = useState<OfferItemRow[]>([])
  const [eventOfferItems, setEventOfferItems] = useState<EventOfferItemRow[]>([])
  const [tab, setTab] = useState<'events' | 'waitlist' | 'registrants' | 'create' | 'hosts' | 'create-host' | 'offers' | 'create-offer' | 'guarantees' | 'contacts'>('events')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null)
  const [editingHost, setEditingHost] = useState<HostRow | null>(null)
  const [editingOffer, setEditingOffer] = useState<OfferItemRow | null>(null)
  const [guarantees, setGuarantees] = useState<GuaranteeRow[]>([])
  const [eventGuarantees, setEventGuarantees] = useState<EventGuaranteeRow[]>([])
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmissionRow[]>([])
  const [expandedRegistrants, setExpandedRegistrants] = useState<string | null>(null)

  // Offer item form
  const [offerForm, setOfferForm] = useState({
    icon: '⭐',
    title: '',
    description: '',
    glow: 'purple',
    is_bonus: false,
    display_order: 0,
    featured_image_url: '',
    bonus_description: '',
    bonus_tags: '' as string,
  })

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
    stripe_product_id: '',
    stripe_price_id: '',
    price: 997,
    is_featured: false,
    special_offer: '',
    instructor_name: 'Daniel Knight',
    company_name: 'Night Vibe',
    theme: 'default',
  })

  // Edit form
  const [editForm, setEditForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    start_date: '',
    end_date: '',
    timezone: 'America/Los_Angeles',
    capacity: 20,
    stripe_payment_link: '',
    stripe_product_id: '',
    stripe_price_id: '',
    price: 997,
    is_featured: false,
    is_public: true,
    special_offer: '',
    theme: 'default',
  })

  // Host form
  const [hostForm, setHostForm] = useState({
    name: '',
    title: '',
    company: '',
    short_description: '',
    bio: '',
    headshot_url: '',
    promo_graphic_url: '',
    category: '',
    is_featured: false,
    stat1_value: '',
    stat1_label: '',
    stat2_value: '',
    stat2_label: '',
    stat3_value: '',
    stat3_label: '',
  })

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      const data = await res.json()
      setEvents(data.events || [])
      setWaitlist(data.waitlist || [])
      setRegistrations(data.registrations || [])
      setHosts(data.hosts || [])
      setEventHosts(data.eventHosts || [])
      setOfferItems(data.offerItems || [])
      setEventOfferItems(data.eventOfferItems || [])
      setGuarantees(data.guarantees || [])
      setEventGuarantees(data.eventGuarantees || [])
      setContactSubmissions(data.contactSubmissions || [])
    }
  }, [password])

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
        setForm({ ...form, title: '', slug: '', subtitle: '', start_date: '', end_date: '', stripe_payment_link: '', stripe_product_id: '', stripe_price_id: '', is_featured: false, special_offer: '', theme: 'default' })
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

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingEvent.id, ...editForm, password }),
      })
      if (res.ok) {
        setMsg('Event updated successfully')
        setEditingEvent(null)
        fetchData()
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to update event')
      }
    } catch {
      setMsg('Network error')
    }
    setSaving(false)
  }

  const handleCreateHost = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/hosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...hostForm, password }),
      })
      if (res.ok) {
        setMsg('Host created successfully')
        setHostForm({
          name: '',
          title: '',
          company: '',
          short_description: '',
          bio: '',
          headshot_url: '',
          promo_graphic_url: '',
          category: '',
          is_featured: false,
          stat1_value: '',
          stat1_label: '',
          stat2_value: '',
          stat2_label: '',
          stat3_value: '',
          stat3_label: '',
        })
        fetchData()
        setTab('hosts')
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to create host')
      }
    } catch {
      setMsg('Network error')
    }
    setSaving(false)
  }

  const handleEditHost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHost) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/hosts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_id: editingHost.id, ...hostForm, password }),
      })
      if (res.ok) {
        setMsg('Host updated successfully')
        setEditingHost(null)
        fetchData()
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to update host')
      }
    } catch {
      setMsg('Network error')
    }
    setSaving(false)
  }

  const deleteHost = async (hostId: string) => {
    if (!confirm('Are you sure you want to delete this host?')) return
    try {
      const res = await fetch('/api/hosts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host_id: hostId, password }),
      })
      if (res.ok) {
        setMsg('Host deleted successfully')
        fetchData()
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to delete host')
      }
    } catch {
      setMsg('Network error')
    }
  }

  const linkHostToEvent = async (eventId: string, hostId: string, role: string, displayOrder: number = 0) => {
    try {
      const res = await fetch('/api/hosts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'link_event', event_id: eventId, host_id_link: hostId, role, display_order: displayOrder }),
      })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to link host')
      }
    } catch {
      setMsg('Network error')
    }
  }

  const unlinkHostFromEvent = async (eventId: string, hostId: string) => {
    try {
      const res = await fetch('/api/hosts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'unlink_event', event_id: eventId, host_id_unlink: hostId }),
      })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to unlink host')
      }
    } catch {
      setMsg('Network error')
    }
  }

  const openEdit = (ev: EventRow) => {
    const ticket = ev.event_tickets?.[0]
    const lpd = ev.landing_page_data || {}
    setEditForm({
      title: ev.title || '',
      slug: ev.slug || '',
      subtitle: ev.subtitle || '',
      start_date: ev.start_date ? new Date(ev.start_date).toISOString().slice(0, 16) : '',
      end_date: ev.end_date ? new Date(ev.end_date).toISOString().slice(0, 16) : '',
      timezone: ev.timezone || 'America/Los_Angeles',
      capacity: ticket?.capacity || ev.capacity || 20,
      stripe_payment_link: ticket?.stripe_payment_link || ev.stripe_payment_link || '',
      stripe_product_id: ticket?.stripe_product_id || ev.stripe_product_id || '',
      stripe_price_id: ticket?.stripe_price_id || '',
      price: ticket?.price || 997,
      is_featured: ev.is_featured || false,
      is_public: ev.is_public !== false,
      special_offer: (lpd as Record<string, string>).special_offer || '',
      theme: ev.theme || 'default',
    })
    setEditingEvent(ev)
  }

  const openEditHost = (host: HostRow) => {
    setHostForm({
      name: host.name || '',
      title: host.title || '',
      company: host.company || '',
      short_description: host.short_description || '',
      bio: host.bio || '',
      headshot_url: host.headshot_url || '',
      promo_graphic_url: host.promo_graphic_url || '',
      category: host.category || '',
      is_featured: host.is_featured || false,
      stat1_value: host.stat1_value || '',
      stat1_label: host.stat1_label || '',
      stat2_value: host.stat2_value || '',
      stat2_label: host.stat2_label || '',
      stat3_value: host.stat3_value || '',
      stat3_label: host.stat3_label || '',
    })
    setEditingHost(host)
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

  // CSV Export utility
  const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportWaitlistCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Date']
    const rows = waitlist.map(w => [
      w.name, w.email, w.phone || '', w.company || '', new Date(w.created_at).toLocaleDateString()
    ])
    downloadCsv('waitlist-export.csv', headers, rows)
  }

  const exportRegistrantsCsv = (eventId?: string) => {
    const filtered = eventId ? registrations.filter(r => r.event_id === eventId) : registrations
    const headers = ['Name', 'Email', 'Phone', 'Amount Paid', 'Product', 'Event', 'Date']
    const rows = filtered.map(r => {
      const evTitle = events.find(e => e.id === r.event_id)?.title || r.product_name
      return [
        r.customer_name, r.customer_email, r.customer_phone || '',
        `$${(r.amount_paid / 100).toFixed(2)}`, r.product_name, evTitle,
        new Date(r.created_at).toLocaleDateString()
      ]
    })
    downloadCsv(eventId ? `registrants-${eventId.slice(0, 8)}.csv` : 'all-registrants.csv', headers, rows)
  }

  // Get registrations for a specific event
  const getEventRegistrations = (eventId: string) => registrations.filter(r => r.event_id === eventId)

  // Get hosts linked to event
  const getLinkedHosts = (eventId: string) => {
    const linkedIds = eventHosts.filter(eh => eh.event_id === eventId)
    return linkedIds.map(eh => {
      const host = hosts.find(h => h.id === eh.host_id)
      return host ? { ...host, role: eh.role, display_order: eh.display_order, event_host_id: eh.id } : null
    }).filter(Boolean)
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
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Night Vibe Admin</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage workshops, events, registrants & waitlist</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a href="/events" style={{ fontSize: 13, color: 'var(--accent-light)', textDecoration: 'none' }}>View calendar →</a>
            <a href="/" style={{ fontSize: 13, color: 'var(--accent-light)', textDecoration: 'none' }}>View landing page →</a>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 2, flexWrap: 'wrap' }}>
          {(['events', 'waitlist', 'registrants', 'create', 'hosts', 'create-host', 'offers', 'create-offer', 'guarantees', 'contacts'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); setEditingEvent(null); setEditingHost(null); setEditingOffer(null) }} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 600, background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'white' : 'var(--text-secondary)', border: 'none', borderRadius: '8px 8px 0 0', cursor: 'pointer', textTransform: 'capitalize'
            }}>
              {t === 'create' ? 'Create Event' : t === 'create-host' ? 'Create Host' : t === 'create-offer' ? 'Create Offer' : t}
              {t === 'events' ? ` (${events.length})` : t === 'waitlist' ? ` (${waitlist.length})` : t === 'registrants' ? ` (${registrations.length})` : t === 'hosts' ? ` (${hosts.length})` : t === 'offers' ? ` (${offerItems.length})` : t === 'guarantees' ? ` (${guarantees.length})` : t === 'contacts' ? ` (${contactSubmissions.length})` : ''}
            </button>
          ))}
        </div>

        {msg && <div style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 20, background: msg.includes('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.includes('success') ? 'var(--success)' : 'var(--danger)', fontSize: 14, fontWeight: 500 }}>{msg}</div>}

        {/* =================== EVENTS TAB =================== */}
        {tab === 'events' && !editingEvent && (
          <div>
            {events.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No events yet. Create your first one.</p>
            ) : (
              events.map((ev) => {
                const ticket = ev.event_tickets?.[0]
                const sold = ticket?.sold_count || 0
                const cap = ticket?.capacity || ev.capacity
                const evRegs = getEventRegistrations(ev.id)
                const linkedHosts = getLinkedHosts(ev.id)
                const isExpanded = expandedRegistrants === ev.id
                return (
                  <div key={ev.id} className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 17, fontWeight: 700 }}>{ev.title}</h3>
                          {ev.is_featured && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--accent)', color: 'white', fontWeight: 600 }}>FEATURED</span>}
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: ev.status === 'published' ? 'rgba(16,185,129,0.2)' : ev.status === 'sold_out' ? 'rgba(239,68,68,0.2)' : ev.status === 'cancelled' ? 'rgba(107,114,128,0.2)' : 'rgba(245,158,11,0.2)', color: ev.status === 'published' ? 'var(--success)' : ev.status === 'sold_out' ? 'var(--danger)' : ev.status === 'cancelled' ? '#6b7280' : 'var(--warning)', fontWeight: 600, textTransform: 'uppercase' }}>{ev.status}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                          {new Date(ev.start_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — {ev.timezone}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Slug: /{ev.slug} &nbsp;|&nbsp; Price: ${ticket?.price || '—'} &nbsp;|&nbsp; Theme: {ev.theme || 'default'}</p>
                        {(ticket?.stripe_product_id || ev.stripe_product_id) && (
                          <p style={{ fontSize: 11, color: 'var(--accent-light)', marginTop: 2 }}>Stripe: {ticket?.stripe_product_id || ev.stripe_product_id}</p>
                        )}
                        {linkedHosts.length > 0 && (
                          <p style={{ fontSize: 12, color: 'var(--accent-light)', marginTop: 6 }}>Hosts: {linkedHosts.map((h: any) => `${h.name} (${h.role})`).join(', ')}</p>
                        )}
                        <a href={`/events/${ev.slug}`} style={{ fontSize: 12, color: 'var(--accent-light)', display: 'inline-block', marginTop: 6 }}>View landing page →</a>
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
                      <button onClick={() => openEdit(ev)} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--accent)' }}>Edit</button>
                      <button onClick={() => toggleFeatured(ev.id, ev.is_featured)} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: ev.is_featured ? 'var(--warning)' : 'var(--border)', color: ev.is_featured ? '#000' : 'var(--text-secondary)' }}>
                        {ev.is_featured ? 'Remove Featured' : 'Set Featured'}
                      </button>
                      {ev.status === 'draft' && <button onClick={() => updateEventStatus(ev.id, 'published')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--success)' }}>Publish</button>}
                      {ev.status === 'published' && <button onClick={() => updateEventStatus(ev.id, 'sold_out')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--danger)' }}>Mark Sold Out</button>}
                      {ev.status === 'sold_out' && <button onClick={() => updateEventStatus(ev.id, 'published')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--success)' }}>Reopen</button>}
                      {ev.status !== 'cancelled' && <button onClick={() => updateEventStatus(ev.id, 'cancelled')} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>Cancel</button>}
                      <button onClick={() => setExpandedRegistrants(isExpanded ? null : ev.id)} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        Registrants ({evRegs.length}) {isExpanded ? '▲' : '▼'}
                      </button>
                      {evRegs.length > 0 && (
                        <button onClick={() => exportRegistrantsCsv(ev.id)} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, background: 'transparent', border: '1px solid var(--accent-light)', color: 'var(--accent-light)' }}>Export CSV</button>
                      )}
                    </div>

                    {/* Expanded registrants dropdown */}
                    {isExpanded && (
                      <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                        {evRegs.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No registrations yet for this event.</p>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Phone</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Paid</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {evRegs.map((r) => (
                                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '8px 10px' }}>{r.customer_name || '—'}</td>
                                    <td style={{ padding: '8px 10px', color: 'var(--accent-light)' }}>{r.customer_email || '—'}</td>
                                    <td style={{ padding: '8px 10px' }}>{r.customer_phone || '—'}</td>
                                    <td style={{ padding: '8px 10px', color: 'var(--success)' }}>${(r.amount_paid / 100).toFixed(2)}</td>
                                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* =================== EDIT EVENT FORM =================== */}
        {tab === 'events' && editingEvent && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit: {editingEvent.title}</h2>
              <button onClick={() => setEditingEvent(null)} className="admin-btn" style={{ padding: '6px 14px', fontSize: 13, background: 'var(--border)' }}>Cancel</button>
            </div>
            <form onSubmit={handleEdit} style={{ maxWidth: 600 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Event Title</label>
                  <input className="admin-input" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>URL Slug</label>
                  <input className="admin-input" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Subtitle</label>
                  <input className="admin-input" value={editForm.subtitle} onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Start Date/Time</label>
                    <input className="admin-input" type="datetime-local" value={editForm.start_date} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} required />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>End Date/Time</label>
                    <input className="admin-input" type="datetime-local" value={editForm.end_date} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Price ($)</label>
                    <input className="admin-input" type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Capacity</label>
                    <input className="admin-input" type="number" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Timezone</label>
                    <select className="admin-input" value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}>
                      <option value="America/Los_Angeles">Pacific</option>
                      <option value="America/Denver">Mountain</option>
                      <option value="America/Chicago">Central</option>
                      <option value="America/New_York">Eastern</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Theme</label>
                  <select className="admin-input" value={editForm.theme} onChange={(e) => setEditForm({ ...editForm, theme: e.target.value })}>
                    <option value="default">Default</option>
                    <option value="purple">Purple</option>
                    <option value="teal">Teal</option>
                    <option value="cosmic">Cosmic</option>
                    <option value="fire">Fire</option>
                    <option value="ocean">Ocean</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stripe Payment Link</label>
                  <input className="admin-input" value={editForm.stripe_payment_link} onChange={(e) => setEditForm({ ...editForm, stripe_payment_link: e.target.value })} placeholder="https://buy.stripe.com/..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stripe Product ID</label>
                    <input className="admin-input" value={editForm.stripe_product_id} onChange={(e) => setEditForm({ ...editForm, stripe_product_id: e.target.value })} placeholder="prod_..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stripe Price ID</label>
                    <input className="admin-input" value={editForm.stripe_price_id} onChange={(e) => setEditForm({ ...editForm, stripe_price_id: e.target.value })} placeholder="price_..." />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8 }}>Find these in Stripe Dashboard &gt; Products. Links sales to this event automatically.</p>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Special Offer</label>
                  <input className="admin-input" value={editForm.special_offer} onChange={(e) => setEditForm({ ...editForm, special_offer: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="edit-featured" checked={editForm.is_featured} onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })} />
                  <label htmlFor="edit-featured" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Set as featured event</label>
                </div>

                {/* Linked Hosts Section */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Linked Hosts</h3>
                  {getLinkedHosts(editingEvent.id).length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hosts linked yet</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                      {getLinkedHosts(editingEvent.id).map((h: any) => (
                        <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 4, border: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 13 }}>{h.name} <span style={{ color: 'var(--text-muted)' }}>({h.role})</span></span>
                          <button type="button" onClick={() => unlinkHostFromEvent(editingEvent.id, h.id)} className="admin-btn" style={{ padding: '2px 8px', fontSize: 11, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>Unlink</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select className="admin-input" id="host-select" style={{ fontSize: 13 }}>
                      <option value="">Select a host to add</option>
                      {hosts.filter(h => !getLinkedHosts(editingEvent.id).some((lh: any) => lh.id === h.id)).map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                    <select className="admin-input" id="host-role" style={{ fontSize: 13 }}>
                      <option value="host">Host</option>
                      <option value="co-host">Co-Host</option>
                      <option value="speaker">Speaker</option>
                      <option value="panelist">Panelist</option>
                    </select>
                  </div>
                  <button type="button" onClick={() => {
                    const hostId = (document.getElementById('host-select') as HTMLSelectElement)?.value
                    const role = (document.getElementById('host-role') as HTMLSelectElement)?.value
                    if (hostId) {
                      linkHostToEvent(editingEvent.id, hostId, role || 'host', 0)
                      if (document.getElementById('host-select') as HTMLSelectElement) (document.getElementById('host-select') as HTMLSelectElement).value = ''
                    }
                  }} className="admin-btn" style={{ padding: '6px 14px', fontSize: 12, marginTop: 8, width: '100%', background: 'var(--accent)' }}>Add Host</button>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" className="admin-btn" style={{ padding: '14px 28px', fontSize: 16 }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditingEvent(null)} className="admin-btn" style={{ padding: '14px 28px', fontSize: 16, background: 'var(--border)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* =================== WAITLIST TAB =================== */}
        {tab === 'waitlist' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Waitlist Signups ({waitlist.length})</h2>
              {waitlist.length > 0 && (
                <button onClick={exportWaitlistCsv} className="admin-btn" style={{ padding: '8px 16px', fontSize: 13, background: 'transparent', border: '1px solid var(--accent-light)', color: 'var(--accent-light)' }}>
                  Export CSV
                </button>
              )}
            </div>
            {waitlist.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No waitlist signups yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Phone</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Company</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map((w) => (
                      <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px' }}>{w.name}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--accent-light)' }}>{w.email}</td>
                        <td style={{ padding: '10px 12px' }}>{w.phone || '—'}</td>
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

        {/* =================== REGISTRANTS TAB =================== */}
        {tab === 'registrants' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>All Registrants ({registrations.length})</h2>
              {registrations.length > 0 && (
                <button onClick={() => exportRegistrantsCsv()} className="admin-btn" style={{ padding: '8px 16px', fontSize: 13, background: 'transparent', border: '1px solid var(--accent-light)', color: 'var(--accent-light)' }}>
                  Export All CSV
                </button>
              )}
            </div>
            {registrations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No registrations yet. They&apos;ll appear here when someone completes a Stripe checkout.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Phone</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Amount</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Product</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Event</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => {
                      const evTitle = events.find(e => e.id === r.event_id)?.title || '—'
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 12px' }}>{r.customer_name || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--accent-light)' }}>{r.customer_email || '—'}</td>
                          <td style={{ padding: '10px 12px' }}>{r.customer_phone || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--success)' }}>${(r.amount_paid / 100).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px' }}>{r.product_name || '—'}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{evTitle}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =================== CREATE EVENT TAB =================== */}
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
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Theme</label>
                <select className="admin-input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
                  <option value="default">Default</option>
                  <option value="purple">Purple</option>
                  <option value="teal">Teal</option>
                  <option value="cosmic">Cosmic</option>
                  <option value="fire">Fire</option>
                  <option value="ocean">Ocean</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stripe Payment Link</label>
                <input className="admin-input" value={form.stripe_payment_link} onChange={(e) => setForm({ ...form, stripe_payment_link: e.target.value })} placeholder="https://buy.stripe.com/..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stripe Product ID</label>
                  <input className="admin-input" value={form.stripe_product_id} onChange={(e) => setForm({ ...form, stripe_product_id: e.target.value })} placeholder="prod_..." />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Stripe Price ID</label>
                  <input className="admin-input" value={form.stripe_price_id} onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value })} placeholder="price_..." />
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8 }}>Stripe Dashboard &gt; Products &gt; Copy product ID (prod_...) and price ID (price_...). This links sales to this event.</p>
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

        {/* =================== HOSTS TAB =================== */}
        {tab === 'hosts' && !editingHost && (
          <div>
            {hosts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No hosts yet. Create your first one.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                {hosts.map((host) => (
                  <div key={host.id} className="card" style={{ padding: 16 }}>
                    {host.headshot_url && (
                      <img src={host.headshot_url} alt={host.name} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 6, marginBottom: 12 }} />
                    )}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>{host.name}</h3>
                      {host.is_featured && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--accent)', color: 'white', fontWeight: 600 }}>FEATURED</span>}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--accent-light)', marginBottom: 4, fontWeight: 500 }}>{host.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{host.company}</p>
                    {host.category && (
                      <p style={{ fontSize: 11, padding: '2px 6px', display: 'inline-block', borderRadius: 3, background: 'rgba(139,92,246,0.2)', color: 'var(--accent-light)', marginBottom: 8 }}>{host.category}</p>
                    )}
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{host.short_description}</p>
                    <button onClick={() => openEditHost(host)} className="admin-btn" style={{ width: '100%', padding: '8px 12px', fontSize: 12, background: 'var(--accent)' }}>Edit</button>
                    <button onClick={() => deleteHost(host.id)} className="admin-btn" style={{ width: '100%', padding: '8px 12px', fontSize: 12, marginTop: 6, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================== EDIT HOST FORM =================== */}
        {tab === 'hosts' && editingHost && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Edit: {editingHost.name}</h2>
              <button onClick={() => setEditingHost(null)} className="admin-btn" style={{ padding: '6px 14px', fontSize: 13, background: 'var(--border)' }}>Cancel</button>
            </div>
            <form onSubmit={handleEditHost} style={{ maxWidth: 600 }}>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Name</label>
                  <input className="admin-input" value={hostForm.name} onChange={(e) => setHostForm({ ...hostForm, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Title</label>
                  <input className="admin-input" value={hostForm.title} onChange={(e) => setHostForm({ ...hostForm, title: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Company</label>
                  <input className="admin-input" value={hostForm.company} onChange={(e) => setHostForm({ ...hostForm, company: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Short Description</label>
                  <input className="admin-input" value={hostForm.short_description} onChange={(e) => setHostForm({ ...hostForm, short_description: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Bio</label>
                  <textarea className="admin-input" value={hostForm.bio} onChange={(e) => setHostForm({ ...hostForm, bio: e.target.value })} style={{ minHeight: 120 }} placeholder="Supports formatting: **bold**, *italic*, - bullet lists, blank lines for paragraphs" />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Formatting: **bold**, *italic*, &quot;- &quot; for bullet lists, blank line for new paragraph</p>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Headshot URL</label>
                  <input className="admin-input" value={hostForm.headshot_url} onChange={(e) => setHostForm({ ...hostForm, headshot_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Promo Graphic URL</label>
                  <input className="admin-input" value={hostForm.promo_graphic_url} onChange={(e) => setHostForm({ ...hostForm, promo_graphic_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
                  <input className="admin-input" value={hostForm.category} onChange={(e) => setHostForm({ ...hostForm, category: e.target.value })} placeholder="e.g. Speaker, Mentor, Instructor" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="host-featured" checked={hostForm.is_featured} onChange={(e) => setHostForm({ ...hostForm, is_featured: e.target.checked })} />
                  <label htmlFor="host-featured" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Featured host</label>
                </div>

                {/* Highlight Stats */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 12 }}>Highlight Stats (up to 3)</p>
                  {[1, 2, 3].map((n) => (
                    <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Stat {n} — Bold Value</label>
                        <input className="admin-input" value={(hostForm as unknown as Record<string, string>)[`stat${n}_value`] || ''} onChange={(e) => setHostForm({ ...hostForm, [`stat${n}_value`]: e.target.value })} placeholder="e.g. $100M+" />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Stat {n} — Subtext</label>
                        <input className="admin-input" value={(hostForm as unknown as Record<string, string>)[`stat${n}_label`] || ''} onChange={(e) => setHostForm({ ...hostForm, [`stat${n}_label`]: e.target.value })} placeholder="e.g. Revenue for Partners" />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" className="admin-btn" style={{ padding: '14px 28px', fontSize: 16 }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditingHost(null)} className="admin-btn" style={{ padding: '14px 28px', fontSize: 16, background: 'var(--border)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* =================== CREATE HOST TAB =================== */}
        {tab === 'create-host' && (
          <form onSubmit={handleCreateHost} style={{ maxWidth: 600 }}>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Name</label>
                <input className="admin-input" value={hostForm.name} onChange={(e) => setHostForm({ ...hostForm, name: e.target.value })} required placeholder="Jane Smith" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Title</label>
                <input className="admin-input" value={hostForm.title} onChange={(e) => setHostForm({ ...hostForm, title: e.target.value })} placeholder="CEO & Founder" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Company</label>
                <input className="admin-input" value={hostForm.company} onChange={(e) => setHostForm({ ...hostForm, company: e.target.value })} placeholder="Acme Inc" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Short Description</label>
                <input className="admin-input" value={hostForm.short_description} onChange={(e) => setHostForm({ ...hostForm, short_description: e.target.value })} placeholder="One-liner bio" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Bio</label>
                <textarea className="admin-input" value={hostForm.bio} onChange={(e) => setHostForm({ ...hostForm, bio: e.target.value })} placeholder="Full bio and background..." style={{ minHeight: 80 }} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Headshot URL</label>
                <input className="admin-input" value={hostForm.headshot_url} onChange={(e) => setHostForm({ ...hostForm, headshot_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Promo Graphic URL</label>
                <input className="admin-input" value={hostForm.promo_graphic_url} onChange={(e) => setHostForm({ ...hostForm, promo_graphic_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
                <input className="admin-input" value={hostForm.category} onChange={(e) => setHostForm({ ...hostForm, category: e.target.value })} placeholder="e.g. Speaker, Mentor, Instructor" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="create-host-featured" checked={hostForm.is_featured} onChange={(e) => setHostForm({ ...hostForm, is_featured: e.target.checked })} />
                <label htmlFor="create-host-featured" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Featured host</label>
              </div>

              {/* Highlight Stats */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 12 }}>Highlight Stats (up to 3)</p>
                {[1, 2, 3].map((n) => (
                  <div key={n} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Stat {n} — Bold Value</label>
                      <input className="admin-input" value={(hostForm as unknown as Record<string, string>)[`stat${n}_value`] || ''} onChange={(e) => setHostForm({ ...hostForm, [`stat${n}_value`]: e.target.value })} placeholder="e.g. $100M+" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Stat {n} — Subtext</label>
                      <input className="admin-input" value={(hostForm as unknown as Record<string, string>)[`stat${n}_label`] || ''} onChange={(e) => setHostForm({ ...hostForm, [`stat${n}_label`]: e.target.value })} placeholder="e.g. Revenue for Partners" />
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="admin-btn" style={{ padding: '14px', fontSize: 16 }} disabled={saving}>
                {saving ? 'Creating...' : 'Create Host'}
              </button>
            </div>
          </form>
        )}

        {/* =================== OFFERS TAB =================== */}
        {tab === 'offers' && !editingOffer && (
          <div>
            {offerItems.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No offer items yet. Create your first one.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {offerItems.map((oi) => {
                  const linkedEvents = eventOfferItems.filter(eoi => eoi.offer_item_id === oi.id)
                  return (
                    <div key={oi.id} className="card" style={{ padding: 20, textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 24 }}>{oi.icon}</span>
                            <h3 style={{ fontSize: 16, fontWeight: 700 }}>{oi.title}</h3>
                            {oi.is_bonus && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', background: 'rgba(245,197,66,0.1)', padding: '2px 8px', borderRadius: 100, border: '1px solid rgba(245,197,66,0.3)' }}>BONUS</span>}
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>#{oi.display_order}</span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{oi.description}</p>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Linked to: {linkedEvents.length === 0 ? 'No events' : linkedEvents.map(le => {
                              const ev = events.find(e => e.id === le.event_id)
                              return ev?.title || le.event_id
                            }).join(', ')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button className="admin-btn" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => {
                            setEditingOffer(oi)
                            setOfferForm({ icon: oi.icon, title: oi.title, description: oi.description, glow: oi.glow, is_bonus: oi.is_bonus, display_order: oi.display_order, featured_image_url: oi.featured_image_url || '', bonus_description: oi.bonus_description || '', bonus_tags: (oi.bonus_tags || []).join(', ') })
                          }}>Edit</button>
                          <button style={{ padding: '6px 14px', fontSize: 12, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, cursor: 'pointer' }} onClick={async () => {
                            if (!confirm('Delete this offer item?')) return
                            await fetch('/api/offer-items', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: oi.id, password }) })
                            fetchData()
                          }}>Delete</button>
                        </div>
                      </div>

                      {/* Link/Unlink to events */}
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-light)', marginBottom: 8 }}>Assign to Events:</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {events.map((ev) => {
                            const isLinked = eventOfferItems.some(eoi => eoi.event_id === ev.id && eoi.offer_item_id === oi.id)
                            return (
                              <button key={ev.id} style={{
                                padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 100, cursor: 'pointer', transition: 'all 0.2s',
                                background: isLinked ? 'rgba(108,58,237,0.15)' : 'transparent',
                                color: isLinked ? 'var(--accent-light)' : 'var(--text-muted)',
                                border: `1px solid ${isLinked ? 'rgba(108,58,237,0.4)' : 'var(--border)'}`,
                              }} onClick={async () => {
                                await fetch('/api/offer-items', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    action: isLinked ? 'unlink_event' : 'link_event',
                                    event_id: ev.id,
                                    offer_item_id: oi.id,
                                    display_order: oi.display_order,
                                    password,
                                  }),
                                })
                                fetchData()
                              }}>
                                {isLinked ? '✓ ' : ''}{ev.title?.substring(0, 30)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Edit Offer Item */}
        {tab === 'offers' && editingOffer && (
          <form onSubmit={async (e) => {
            e.preventDefault()
            setSaving(true)
            setMsg('')
            try {
              const res = await fetch('/api/offer-items', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingOffer.id, ...offerForm, bonus_tags: offerForm.bonus_tags ? offerForm.bonus_tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [], password }),
              })
              if (res.ok) {
                setMsg('Offer item updated successfully')
                setEditingOffer(null)
                fetchData()
              } else {
                const err = await res.json()
                setMsg(err.error || 'Failed to update')
              }
            } catch { setMsg('Network error') }
            setSaving(false)
          }}>
            <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Offer Item</h2>
                <button type="button" onClick={() => setEditingOffer(null)} style={{ fontSize: 13, color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Icon</label>
                  <input className="admin-input" value={offerForm.icon} onChange={(e) => setOfferForm({ ...offerForm, icon: e.target.value })} style={{ textAlign: 'center', fontSize: 20 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
                  <input className="admin-input" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea className="admin-input" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} style={{ minHeight: 60 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Glow Color</label>
                  <select className="admin-input" value={offerForm.glow} onChange={(e) => setOfferForm({ ...offerForm, glow: e.target.value })}>
                    <option value="purple">Purple</option>
                    <option value="teal">Teal</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Order</label>
                  <input className="admin-input" type="number" value={offerForm.display_order} onChange={(e) => setOfferForm({ ...offerForm, display_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8, paddingBottom: 4 }}>
                  <input type="checkbox" id="edit-offer-bonus" checked={offerForm.is_bonus} onChange={(e) => setOfferForm({ ...offerForm, is_bonus: e.target.checked })} />
                  <label htmlFor="edit-offer-bonus" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Bonus item</label>
                </div>
              </div>
              {offerForm.is_bonus && (
                <div style={{ display: 'grid', gap: 12, padding: 16, background: 'rgba(245,197,66,0.05)', border: '1px solid rgba(245,197,66,0.2)', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>Bonus Section Details</p>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Featured Image URL</label>
                    <input className="admin-input" value={offerForm.featured_image_url} onChange={(e) => setOfferForm({ ...offerForm, featured_image_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bonus Description (shown in featured section)</label>
                    <textarea className="admin-input" value={offerForm.bonus_description} onChange={(e) => setOfferForm({ ...offerForm, bonus_description: e.target.value })} placeholder="Extended description for the featured bonus section..." style={{ minHeight: 80 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tags (comma-separated)</label>
                    <input className="admin-input" value={offerForm.bonus_tags} onChange={(e) => setOfferForm({ ...offerForm, bonus_tags: e.target.value })} placeholder="e.g. Structured App Design, Step-by-Step Launch Plan" />
                  </div>
                </div>
              )}
              <button type="submit" className="admin-btn" style={{ padding: '14px', fontSize: 16 }} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* =================== CREATE OFFER TAB =================== */}
        {tab === 'create-offer' && (
          <form onSubmit={async (e) => {
            e.preventDefault()
            setSaving(true)
            setMsg('')
            try {
              const res = await fetch('/api/offer-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...offerForm, bonus_tags: offerForm.bonus_tags ? offerForm.bonus_tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [], password }),
              })
              if (res.ok) {
                setMsg('Offer item created successfully')
                setOfferForm({ icon: '⭐', title: '', description: '', glow: 'purple', is_bonus: false, display_order: 0, featured_image_url: '', bonus_description: '', bonus_tags: '' })
                fetchData()
                setTab('offers')
              } else {
                const err = await res.json()
                setMsg(err.error || 'Failed to create')
              }
            } catch { setMsg('Network error') }
            setSaving(false)
          }}>
            <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Create Offer Item</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Icon</label>
                  <input className="admin-input" value={offerForm.icon} onChange={(e) => setOfferForm({ ...offerForm, icon: e.target.value })} style={{ textAlign: 'center', fontSize: 20 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
                  <input className="admin-input" value={offerForm.title} onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })} required placeholder="e.g. Full Recording Access" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea className="admin-input" value={offerForm.description} onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })} placeholder="Short description of this offer item" style={{ minHeight: 60 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Glow Color</label>
                  <select className="admin-input" value={offerForm.glow} onChange={(e) => setOfferForm({ ...offerForm, glow: e.target.value })}>
                    <option value="purple">Purple</option>
                    <option value="teal">Teal</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Order</label>
                  <input className="admin-input" type="number" value={offerForm.display_order} onChange={(e) => setOfferForm({ ...offerForm, display_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'end', gap: 8, paddingBottom: 4 }}>
                  <input type="checkbox" id="create-offer-bonus" checked={offerForm.is_bonus} onChange={(e) => setOfferForm({ ...offerForm, is_bonus: e.target.checked })} />
                  <label htmlFor="create-offer-bonus" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Bonus item</label>
                </div>
              </div>
              {offerForm.is_bonus && (
                <div style={{ display: 'grid', gap: 12, padding: 16, background: 'rgba(245,197,66,0.05)', border: '1px solid rgba(245,197,66,0.2)', borderRadius: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>Bonus Section Details</p>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Featured Image URL</label>
                    <input className="admin-input" value={offerForm.featured_image_url} onChange={(e) => setOfferForm({ ...offerForm, featured_image_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Bonus Description (shown in featured section)</label>
                    <textarea className="admin-input" value={offerForm.bonus_description} onChange={(e) => setOfferForm({ ...offerForm, bonus_description: e.target.value })} placeholder="Extended description for the featured bonus section..." style={{ minHeight: 80 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tags (comma-separated)</label>
                    <input className="admin-input" value={offerForm.bonus_tags} onChange={(e) => setOfferForm({ ...offerForm, bonus_tags: e.target.value })} placeholder="e.g. Structured App Design, Step-by-Step Launch Plan" />
                  </div>
                </div>
              )}
              <button type="submit" className="admin-btn" style={{ padding: '14px', fontSize: 16 }} disabled={saving}>
                {saving ? 'Creating...' : 'Create Offer Item'}
              </button>
            </div>
          </form>
        )}

        {/* =================== GUARANTEES TAB =================== */}
        {tab === 'guarantees' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Create Guarantee</h2>
              <form onSubmit={async (e) => {
                e.preventDefault()
                setSaving(true)
                setMsg('')
                try {
                  const res = await fetch('/api/guarantees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...guaranteeForm, password }),
                  })
                  if (res.ok) {
                    setMsg('Guarantee created successfully')
                    setGuaranteeForm({ title: '', description: '', icon: '✓' })
                    fetchData()
                  } else {
                    const err = await res.json()
                    setMsg(err.error || 'Failed to create')
                  }
                } catch { setMsg('Network error') }
                setSaving(false)
              }}>
                <div style={{ display: 'grid', gap: 12, maxWidth: 500 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Icon</label>
                      <input className="admin-input" value={guaranteeForm.icon} onChange={(e) => setGuaranteeForm({ ...guaranteeForm, icon: e.target.value })} style={{ textAlign: 'center', fontSize: 20 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title *</label>
                      <input className="admin-input" value={guaranteeForm.title} onChange={(e) => setGuaranteeForm({ ...guaranteeForm, title: e.target.value })} required placeholder="e.g. 30-Day Money Back" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                    <textarea className="admin-input" value={guaranteeForm.description} onChange={(e) => setGuaranteeForm({ ...guaranteeForm, description: e.target.value })} placeholder="Detailed description of the guarantee" style={{ minHeight: 60 }} />
                  </div>
                  <button type="submit" className="admin-btn" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Guarantee'}
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>All Guarantees ({guarantees.length})</h2>
              <div style={{ display: 'grid', gap: 8 }}>
                {guarantees.map((g: GuaranteeRow) => (
                  <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 24 }}>{g.icon}</div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700 }}>{g.title}</p>
                      {g.description && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.description}</p>}
                    </div>
                    <button onClick={async () => {
                      if (!confirm('Delete this guarantee?')) return
                      setSaving(true)
                      try {
                        const res = await fetch(`/api/guarantees/${g.id}`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password }),
                        })
                        if (res.ok) {
                          fetchData()
                          setMsg('Guarantee deleted')
                        } else {
                          setMsg('Failed to delete')
                        }
                      } catch { setMsg('Network error') }
                      setSaving(false)
                    }} style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(255,0,0,0.1)', color: 'var(--text-error)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                ))}
                {guarantees.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No guarantees created yet</p>}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Assign Guarantees to Events</h2>
              <div style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Select Event *</label>
                  <select className="admin-input" onChange={(e) => {
                    const eventId = e.target.value
                    const event = events.find((ev: any) => ev.id === eventId)
                    if (event) {
                      setEventGuaranteeForm({ event_id: eventId, guarantee_id: '' })
                    }
                  }}>
                    <option value="">Choose an event...</option>
                    {events.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
                {eventGuaranteeForm.event_id && (
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Select Guarantee *</label>
                    <select className="admin-input" value={eventGuaranteeForm.guarantee_id} onChange={(e) => setEventGuaranteeForm({ ...eventGuaranteeForm, guarantee_id: e.target.value })}>
                      <option value="">Choose a guarantee...</option>
                      {guarantees.map((g: GuaranteeRow) => (
                        <option key={g.id} value={g.id}>{g.icon} {g.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                {eventGuaranteeForm.event_id && eventGuaranteeForm.guarantee_id && (
                  <button onClick={async () => {
                    setSaving(true)
                    try {
                      const res = await fetch('/api/event-guarantees', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...eventGuaranteeForm, password }),
                      })
                      if (res.ok) {
                        setMsg('Guarantee assigned to event')
                        setEventGuaranteeForm({ event_id: '', guarantee_id: '' })
                        fetchData()
                      } else {
                        setMsg('Failed to assign')
                      }
                    } catch { setMsg('Network error') }
                    setSaving(false)
                  }} className="admin-btn" disabled={saving}>
                    {saving ? 'Assigning...' : 'Assign Guarantee'}
                  </button>
                )}
              </div>

              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Event Guarantees ({eventGuarantees.length})</h3>
                <div style={{ display: 'grid', gap: 6 }}>
                  {eventGuarantees.map((eg: EventGuaranteeRow) => {
                    const event = events.find((e: any) => e.id === eg.event_id)
                    const guarantee = guarantees.find((g: GuaranteeRow) => g.id === eg.guarantee_id)
                    return (
                      <div key={eg.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 10, background: 'var(--bg-tertiary)', borderRadius: 6, alignItems: 'center' }}>
                        <p style={{ fontSize: 12 }}><strong>{event?.title}</strong> → {guarantee?.icon} {guarantee?.title}</p>
                        <button onClick={async () => {
                          if (!confirm('Remove this assignment?')) return
                          setSaving(true)
                          try {
                            const res = await fetch(`/api/event-guarantees/${eg.id}`, {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ password }),
                            })
                            if (res.ok) {
                              fetchData()
                            } else {
                              setMsg('Failed to remove')
                            }
                          } catch { setMsg('Network error') }
                          setSaving(false)
                        }} style={{ padding: '4px 8px', fontSize: 11, background: 'rgba(255,0,0,0.1)', color: 'var(--text-error)', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
                          Remove
                        </button>
                      </div>
                    )
                  })}
                  {eventGuarantees.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No assignments yet</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================== CONTACTS TAB =================== */}
        {tab === 'contacts' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Contact Submissions ({contactSubmissions.length})</h2>
            {contactSubmissions.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {contactSubmissions.map((cs: ContactSubmissionRow) => (
                  <div key={cs.id} style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 8, borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700 }}>{cs.name}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{cs.email}</p>
                        {cs.phone && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{cs.phone}</p>}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(cs.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {cs.message && (
                      <div style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginBottom: 12 }}>
                        <p style={{ fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{cs.message}</p>
                      </div>
                    )}
                    <button onClick={async () => {
                      if (!confirm('Delete this submission?')) return
                      setSaving(true)
                      try {
                        const res = await fetch(`/api/contact-submissions/${cs.id}`, {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password }),
                        })
                        if (res.ok) {
                          fetchData()
                        } else {
                          setMsg('Failed to delete')
                        }
                      } catch { setMsg('Network error') }
                      setSaving(false)
                    }} style={{ padding: '6px 12px', fontSize: 12, background: 'rgba(255,0,0,0.1)', color: 'var(--text-error)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No contact submissions yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
