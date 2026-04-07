'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function QuestionnaireContent() {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event_id') || ''
  const prefillEmail = searchParams.get('email') || ''
  const prefillName = searchParams.get('name') || ''
  const trialParam = searchParams.get('trial') !== 'false'

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
  const [tempPassword, setTempPassword] = useState('')
  const [copied, setCopied] = useState(false)
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
      if (qData.temp_password) setTempPassword(qData.temp_password)
      // Redirect to appdash dashboard
      window.location.href = 'https://appdash.me/app'
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    const appdashLogin = 'https://appdash.me/login'
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 540, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>{freeTrial && tempPassword ? '🚀' : '🎉'}</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            {freeTrial && tempPassword ? "You're in. Let's build." : 'Thanks!'}
          </h1>
          <p style={{ fontSize: 17, color: '#9ca3af', lineHeight: 1.6, marginBottom: 28 }}>
            {freeTrial && tempPassword
              ? 'Your free trial account is ready and your app idea is pre-loaded. Use the credentials below to log in — you\'ll be prompted to set a permanent password on first login.'
              : "We'll use your answers to personalize your workshop experience. Get ready to build something incredible."}
          </p>

          {freeTrial && tempPassword ? (
            <div>
              {/* Credentials card */}
              <div style={{
                background: 'rgba(45,212,191,0.06)',
                border: '1px solid rgba(45,212,191,0.25)',
                borderRadius: 16,
                padding: '24px 28px',
                marginBottom: 24,
                textAlign: 'left',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
                  Your Login Credentials
                </p>
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Email</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'monospace' }}>{form.email}</p>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 4px' }}>Temporary Password</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#2dd4bf', margin: 0, fontFamily: 'monospace', letterSpacing: '0.05em', flex: 1, wordBreak: 'break-all' }}>
                      {tempPassword}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(tempPassword)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      style={{
                        padding: '8px 14px', background: copied ? '#166534' : 'rgba(45,212,191,0.15)',
                        border: '1px solid rgba(45,212,191,0.3)', borderRadius: 8,
                        color: copied ? '#86efac' : '#2dd4bf', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                      }}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  You&apos;ll be asked to set a permanent password after your first login. Check your email for a confirmation link too.
                </p>
              </div>

              <a
                href={appdashLogin}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', padding: '16px 40px',
                  background: 'linear-gradient(135deg, #2dd4bf, #6c3aed)',
                  color: '#fff', textDecoration: 'none', borderRadius: 12,
                  fontWeight: 700, fontSize: 16, marginBottom: 12,
                }}
              >
                Log In to appdash.me →
              </a>
              <p style={{ fontSize: 13, color: '#4b5563', marginTop: 8 }}>
                appdash.me · your app is already pre-loaded
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
                Start my build with a free trial at appdash.me
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
