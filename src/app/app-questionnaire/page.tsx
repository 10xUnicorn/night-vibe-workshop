'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AppQuestionnairePage() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event_id') || ''
  const email = searchParams.get('email') || ''

  const [form, setForm] = useState({
    app_idea: '',
    problem: '',
    target_customer: '',
    existing_business: '',
    biggest_challenge: '',
    technical_level: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [eventTitle, setEventTitle] = useState('')

  useEffect(() => {
    if (eventId) {
      fetch(`/api/events?id=${eventId}`)
        .then(r => r.json())
        .then(d => { if (d?.title) setEventTitle(d.title) })
        .catch(() => {})
    }
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, event_id: eventId || null, email }),
      })
      setSubmitted(true)
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 500, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Thanks!</h1>
          <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.6, marginBottom: 24 }}>
            We'll use your answers to personalize your workshop experience. Get ready to build something incredible.
          </p>
          <a href="/" style={{ display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg, #6c3aed, #a78bfa)', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
            Back to Night Vibe
          </a>
        </div>
      </div>
    )
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', background: 'rgba(19,19,26,0.8)',
    border: '1px solid rgba(108,58,237,0.2)', borderRadius: 10, color: '#fff',
    fontSize: 15, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 14, fontWeight: 600, color: '#d1d5db', marginBottom: 8,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '60px 20px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            <span style={{ color: '#a78bfa' }}>Night</span> <span style={{ color: '#2dd4bf' }}>Vibe</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.15 }}>
            What Are You Going to Build? 🛠️
          </h1>
          <p style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
            Help us personalize your workshop experience. Tell us about your app idea so your hosts can prepare.
            {eventTitle && <><br /><span style={{ color: '#a78bfa', fontWeight: 600 }}>{eventTitle}</span></>}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
          <div style={{ background: 'rgba(19,19,26,0.5)', border: '1px solid rgba(108,58,237,0.15)', borderRadius: 16, padding: 28, display: 'grid', gap: 20 }}>
            <div>
              <label style={labelStyle}>What&apos;s your app idea? *</label>
              <textarea
                required
                value={form.app_idea}
                onChange={e => setForm({ ...form, app_idea: e.target.value })}
                placeholder="Describe the app you want to build..."
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle}>What problem does it solve? *</label>
              <textarea
                required
                value={form.problem}
                onChange={e => setForm({ ...form, problem: e.target.value })}
                placeholder="What pain point or need does your app address?"
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Who is your target customer?</label>
              <input
                value={form.target_customer}
                onChange={e => setForm({ ...form, target_customer: e.target.value })}
                placeholder="e.g. Small business owners, freelancers, students..."
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Do you have an existing business?</label>
              <select
                value={form.existing_business}
                onChange={e => setForm({ ...form, existing_business: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="" style={{ background: '#13131a' }}>Select one...</option>
                <option value="yes" style={{ background: '#13131a' }}>Yes</option>
                <option value="no" style={{ background: '#13131a' }}>No</option>
                <option value="working_on_it" style={{ background: '#13131a' }}>Working on it</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>What&apos;s your biggest challenge right now?</label>
              <textarea
                value={form.biggest_challenge}
                onChange={e => setForm({ ...form, biggest_challenge: e.target.value })}
                placeholder="What's holding you back from building or launching?"
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={labelStyle}>How technical are you?</label>
              <select
                value={form.technical_level}
                onChange={e => setForm({ ...form, technical_level: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="" style={{ background: '#13131a' }}>Select one...</option>
                <option value="not_at_all" style={{ background: '#13131a' }}>Not at all — brand new to this</option>
                <option value="somewhat" style={{ background: '#13131a' }}>Somewhat — I've used no-code tools or basic coding</option>
                <option value="very" style={{ background: '#13131a' }}>Very — I have development experience</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '16px', fontSize: 16, fontWeight: 700, color: '#fff',
              background: submitting ? '#4b5563' : 'linear-gradient(135deg, #6c3aed, #a78bfa)',
              border: 'none', borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit My Answers'}
          </button>
        </form>
      </div>
    </div>
  )
}
