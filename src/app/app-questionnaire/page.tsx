'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function QuestionnaireContent() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event_id') || ''
  const prefillEmail = searchParams.get('email') || ''
  const prefillName = searchParams.get('name') || ''
  const trialParam = searchParams.get('trial') === 'true'

  const [form, setForm] = useState({
    name: prefillName,
    email: prefillEmail,
    app_idea: '',
    problem: '',
    target_customer: '',
    existing_business: '',
    biggest_challenge: '',
    technical_level: '',
  })
  const [freeTrial, setFreeTrial] = useState(trialParam)
  const [magicLink, setMagicLink] = useState('')
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
      const res = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, event_id: eventId || null, free_trial: freeTrial }),
      })
      const qData = await res.json()
      if (qData.magic_link) setMagicLink(qData.magic_link)
      setSubmitted(true)
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>{freeTrial && magicLink ? '🚀' : '🎉'}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            {freeTrial && magicLink ? "You're in. Let's build." : 'Thanks!'}
          </h1>
          <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.6, marginBottom: 28 }}>
            {freeTrial && magicLink
              ? 'Your free trial account is ready and your app idea is pre-loaded. Click below to access your dashboard.'
              : "We'll use your answers to personalize your workshop experience. Get ready to build something incredible."}
          </p>
          {freeTrial && magicLink ? (
            <div>
              <a
                href={magicLink}
                style={{ display: 'inline-block', padding: '16px 40px', background: 'linear-gradient(135deg, #2dd4bf, #6c3aed)', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 16, marginBottom: 16 }}
              >
                Access My App Dashboard →
              </a>
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 12 }}>
                One-time login link · expires in 24 hours
              </p>
            </div>
          ) : (
            <a href="/" style={{ display: 'inline-block', padding: '14px 32px', background: 'linear-gradient(135deg, #6c3aed, #a78bfa)', color: '#fff', textDecoration: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15 }}>
              Back to Night Vibe
            </a>
          )}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Your Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="First & last name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Your Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@email.com"
                  style={inputStyle}
                />
              </div>
            </div>

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

          {/* Free trial checkbox */}
          <div
            onClick={() => setFreeTrial(v => !v)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: '20px 24px',
              background: freeTrial ? 'rgba(45,212,191,0.06)' : 'rgba(19,19,26,0.3)',
              border: `1px solid ${freeTrial ? 'rgba(45,212,191,0.3)' : 'rgba(108,58,237,0.2)'}`,
              borderRadius: 16, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
              background: freeTrial ? '#2dd4bf' : 'transparent',
              border: `2px solid ${freeTrial ? '#2dd4bf' : 'rgba(108,58,237,0.4)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
            }}>
              {freeTrial && <span style={{ color: '#0a0a0f', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: freeTrial ? '#2dd4bf' : '#d1d5db' }}>
                Start my build with a free trial at app.me
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                Your app idea will be pre-loaded in your dashboard. 14-day free trial, no credit card required.
              </p>
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
            {submitting ? 'Submitting...' : freeTrial ? 'Submit & Start My Free Trial →' : 'Submit My Answers'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AppQuestionnairePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, border: '3px solid #1f2937', borderTopColor: '#6c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /><style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style></div>}>
      <QuestionnaireContent />
    </Suspense>
  )
}
