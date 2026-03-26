'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

interface SocialProofEntry {
  id?: string
  name: string
  location: string
  workshop_name: string
}

const FALLBACK_ENTRIES: SocialProofEntry[] = [
  { name: 'Sarah M.', location: 'Austin, TX', workshop_name: 'Build & Launch Your App' },
  { name: 'Marcus J.', location: 'Miami, FL', workshop_name: 'Build & Launch Your App' },
  { name: 'Priya K.', location: 'San Francisco, CA', workshop_name: 'Build & Launch Your App' },
  { name: 'James T.', location: 'New York, NY', workshop_name: 'Build & Launch Your App' },
  { name: 'Elena R.', location: 'Denver, CO', workshop_name: 'Build & Launch Your App' },
  { name: 'David L.', location: 'Chicago, IL', workshop_name: 'Build & Launch Your App' },
  { name: 'Aisha W.', location: 'Atlanta, GA', workshop_name: 'Build & Launch Your App' },
  { name: 'Carlos P.', location: 'Los Angeles, CA', workshop_name: 'Build & Launch Your App' },
]

export default function SocialProofPopup() {
  const [entries, setEntries] = useState<SocialProofEntry[]>([])
  const [current, setCurrent] = useState<SocialProofEntry | null>(null)
  const [visible, setVisible] = useState(false)
  const usedRef = useRef<number[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hideRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetch('/api/social-proof')
      .then(r => r.json())
      .then(d => setEntries(d && d.length > 0 ? d : FALLBACK_ENTRIES))
      .catch(() => setEntries(FALLBACK_ENTRIES))
  }, [])

  const getNext = useCallback(() => {
    if (entries.length === 0) return null
    if (usedRef.current.length >= entries.length) usedRef.current = []
    let idx: number
    do {
      idx = Math.floor(Math.random() * entries.length)
    } while (usedRef.current.includes(idx) && usedRef.current.length < entries.length)
    usedRef.current.push(idx)
    return entries[idx]
  }, [entries])

  const showNext = useCallback(() => {
    const entry = getNext()
    if (!entry) return
    setCurrent(entry)
    setVisible(true)
    hideRef.current = setTimeout(() => setVisible(false), 4000)
  }, [getNext])

  useEffect(() => {
    if (entries.length === 0) return
    const initialDelay = 5000 + Math.random() * 5000
    const startTimer = setTimeout(() => {
      showNext()
      timerRef.current = setInterval(() => {
        showNext()
      }, 8000 + Math.random() * 7000)
    }, initialDelay)

    return () => {
      clearTimeout(startTimer)
      if (timerRef.current) clearInterval(timerRef.current)
      if (hideRef.current) clearTimeout(hideRef.current)
    }
  }, [entries, showNext])

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase()

  if (!current) return null

  return (
    <>
      <style>{`
        @keyframes socialSlideIn { from { transform: translateX(-120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes socialSlideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-120%); opacity: 0; } }
      `}</style>
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        maxWidth: 380,
        animation: visible ? 'socialSlideIn 0.5s ease forwards' : 'socialSlideOut 0.5s ease forwards',
        pointerEvents: visible ? 'auto' : 'none',
      }}>
        <div style={{
          background: 'rgba(19, 19, 26, 0.95)',
          border: '1px solid rgba(108, 58, 237, 0.35)',
          borderRadius: 14,
          padding: '14px 16px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(108,58,237,0.1)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {getInitials(current.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5, margin: 0 }}>
              <span style={{ marginRight: 4 }}>🎉</span>
              <span style={{ fontWeight: 700, color: 'white' }}>{current.name}</span>
              {' '}from{' '}
              <span style={{ fontWeight: 600, color: 'white' }}>{current.location}</span>
              {' '}just registered for{' '}
              <span style={{ fontWeight: 600, color: '#a78bfa' }}>{current.workshop_name}</span>
            </p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>a few moments ago</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            style={{
              background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
              padding: 4, fontSize: 16, lineHeight: 1, flexShrink: 0,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>
    </>
  )
}
