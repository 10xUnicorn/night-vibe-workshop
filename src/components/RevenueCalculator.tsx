'use client'

import { useState } from 'react'

interface Preset {
  label: string
  emoji: string
  price: number
  users: number
}

const presets: Preset[] = [
  { label: 'Simple Utility', emoji: '\u{1F4F1}', price: 19, users: 250 },
  { label: 'AI Tool', emoji: '\u{1F916}', price: 29, users: 500 },
  { label: 'B2B SaaS', emoji: '\u{1F4BC}', price: 49, users: 300 },
  { label: 'Consumer App', emoji: '\u{1F30D}', price: 9, users: 1200 },
  { label: 'Coaching / Course', emoji: '\u{1F3C6}', price: 97, users: 150 },
  { label: 'Marketplace', emoji: '\u{1F3E0}', price: 15, users: 800 },
  { label: 'Agency Portal', emoji: '\u{1F3AF}', price: 79, users: 200 },
  { label: 'Health / Fitness', emoji: '\u{1F4AA}', price: 14, users: 900 },
]

interface Props {
  workshopPrice: number
  ctaUrl: string
  isSoldOut: boolean
  onWaitlist: () => void
}

export default function RevenueCalculator({ workshopPrice, ctaUrl, isSoldOut, onWaitlist }: Props) {
  const [price, setPrice] = useState(19)
  const [users, setUsers] = useState(250)
  const [activePreset, setActivePreset] = useState<string>('Simple Utility')

  const mrr = price * users
  const arr = mrr * 12
  const threeYear = arr * 3
  const paybackMonths = mrr > 0 ? (workshopPrice / mrr) : 999

  const formatNum = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
    return `$${n.toFixed(0)}`
  }

  const applyPreset = (p: Preset) => {
    setPrice(p.price)
    setUsers(p.users)
    setActivePreset(p.label)
  }

  return (
    <div className="revenue-calc">
      {/* Preset buttons */}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 16 }}>
        // Tap an app type to set realistic defaults
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className={`preset-btn ${activePreset === p.label ? 'active' : ''}`}
          >
            <span style={{ fontSize: 16 }}>{p.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{p.label}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>${p.price} · {p.users.toLocaleString()} users</span>
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 12 }}>
            Monthly Price Per User
          </label>
          <div className="calc-input-wrap">
            <span className="calc-prefix">$</span>
            <input
              type="number"
              value={price}
              onChange={(e) => { setPrice(Number(e.target.value)); setActivePreset('') }}
              className="calc-input"
              min={1}
              max={999}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Common range: $9–$99/mo per user</p>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 12 }}>
            Number of Paid Users
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="calc-value">
              <span className="calc-value-num">{users.toLocaleString()}</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>paid users</span>
            </div>
          </div>
          <input
            type="range"
            min={10}
            max={5000}
            step={10}
            value={users}
            onChange={(e) => { setUsers(Number(e.target.value)); setActivePreset('') }}
            className="calc-slider"
            style={{ width: '100%', marginTop: 12 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            <span>10</span><span>500</span><span>1K</span><span>2.5K</span><span>5K</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--accent-light)', textAlign: 'center', marginBottom: 16 }}>
        // Projected Revenue
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="calc-result-card">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8 }}>Monthly MRR</p>
          <div className="calc-result-num gradient-text">{formatNum(mrr)}</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>per month</p>
        </div>
        <div className="calc-result-card">
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8 }}>Annual Revenue</p>
          <div className="calc-result-num gradient-text">{formatNum(arr)}</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>per year</p>
        </div>
      </div>

      <div className="calc-result-card gold-card" style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--gold)', marginBottom: 8 }}>3-Year Potential</p>
        <div className="calc-result-big gold-text">{formatNum(threeYear)}</div>
        <p style={{ fontSize: 13, color: 'var(--gold)', opacity: 0.7 }}>at same user count · pure recurring revenue</p>
      </div>

      <div className="calc-payback">
        <p style={{ fontSize: 16, lineHeight: 1.6 }}>
          At <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>{users.toLocaleString()}</span> paid users at <span style={{ color: 'var(--accent-light)', fontWeight: 800 }}>${price}/mo</span>, your app covers the full cost of this workshop in{' '}
          <span style={{ fontWeight: 800, color: 'white', textDecoration: 'underline', textDecorationColor: 'var(--accent)' }}>
            {paybackMonths < 0.1 ? 'less than a day' : paybackMonths < 1 ? `${Math.ceil(paybackMonths * 30)} days` : `${paybackMonths.toFixed(1)} months`}
          </span>{' '}
          — then it&apos;s pure profit.
        </p>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, marginBottom: 24 }}>
        * Projections are illustrative. Actual results depend on your market, pricing, and growth strategy.
      </p>

      <p style={{ textAlign: 'center', fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Ready to build the app behind these numbers?
      </p>

      <div style={{ textAlign: 'center' }}>
        {isSoldOut ? (
          <button className="btn-accent" onClick={onWaitlist}>Join the Waitlist</button>
        ) : (
          <a href={ctaUrl} className="btn-accent" target="_blank" rel="noopener noreferrer">
            Reserve Your Seat — ${workshopPrice}
          </a>
        )}
      </div>
    </div>
  )
}
