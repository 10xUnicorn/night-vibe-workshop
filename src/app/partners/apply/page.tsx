'use client'

import { useState } from 'react'

export default function AffiliateApplicationPage() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    website_url: '',
    partnership_reason: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/affiliates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 500, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>✨</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Application Submitted!</h1>
          <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>
            Thank you for your interest in joining the Night Vibe Partner Program. We'll review your application and get back to you within 24-48 hours.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            <a href="/" style={{ display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg, #6c3aed, #a78bfa)', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
              Back to Night Vibe
            </a>
            <a href="/partners" style={{ display: 'inline-block', padding: '14px 32px', background: 'rgba(45,212,191,0.15)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.3)', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
              Partners Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(19,19,26,0.8)',
    border: '1px solid rgba(108,58,237,0.2)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#d1d5db',
    marginBottom: 8,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '60px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>
            <span style={{ color: '#a78bfa' }}>NIGHT</span> <span style={{ color: '#2dd4bf' }}>VIBE</span>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#2dd4bf', marginBottom: 16, letterSpacing: 1, textTransform: 'uppercase' }}>
            Partner Program
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#fff', marginBottom: 16, lineHeight: 1.15 }}>
            Earn Commissions While You Refer
          </h1>
          <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.7, maxWidth: 550, margin: '0 auto' }}>
            Join our partner program and earn 15-25% commission for every referral. Get custom tracking links, real-time dashboard access, and exclusive promo materials.
          </p>
        </div>

        {/* Benefits Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 40 }}>
          <div style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2dd4bf', marginBottom: 4 }}>15-25%</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Commission</div>
          </div>
          <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔗</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>Custom Links</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Tracking URLs</div>
          </div>
          <div style={{ background: 'rgba(108,58,237,0.08)', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>Live Dashboard</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Real-time Stats</div>
          </div>
          <div style={{ background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2dd4bf', marginBottom: 4 }}>Promo Materials</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Ready to Share</div>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
          <div style={{ background: 'rgba(19,19,26,0.5)', border: '1px solid rgba(108,58,237,0.15)', borderRadius: 16, padding: '32px 28px', display: 'grid', gap: 20 }}>
            {/* Error Message */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '14px 16px', color: '#fca5a5', fontSize: 14 }}>
                {error}
              </div>
            )}

            {/* Name Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>First Name *</label>
                <input
                  required
                  type="text"
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                  placeholder="John"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name *</label>
                <input
                  required
                  type="text"
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Doe"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                style={inputStyle}
              />
            </div>

            {/* Company */}
            <div>
              <label style={labelStyle}>Company / Brand</label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                placeholder="Your company or brand name"
                style={inputStyle}
              />
            </div>

            {/* Website / Social */}
            <div>
              <label style={labelStyle}>Website or Social Media URL</label>
              <input
                type="url"
                value={form.website_url}
                onChange={e => setForm({ ...form, website_url: e.target.value })}
                placeholder="https://yoursite.com or @yourhandle"
                style={inputStyle}
              />
            </div>

            {/* Partnership Reason */}
            <div>
              <label style={labelStyle}>Why do you want to become a partner? *</label>
              <textarea
                required
                value={form.partnership_reason}
                onChange={e => setForm({ ...form, partnership_reason: e.target.value })}
                placeholder="Tell us about your audience and why you're interested in referring Night Vibe workshops..."
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '16px',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              background: submitting ? '#4b5563' : 'linear-gradient(135deg, #6c3aed, #a78bfa)',
              border: 'none',
              borderRadius: 12,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>

          <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
            Already a partner?{' '}
            <a href="/partners" style={{ color: '#2dd4bf', textDecoration: 'none', fontWeight: 600 }}>
              Log in to your dashboard
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
