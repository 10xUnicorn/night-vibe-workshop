'use client'

import { useState, useEffect, useCallback } from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop.nightvibe.me'

// ─── Types ───────────────────────────────────────────────────────
interface AffiliateData {
  id: string; first_name: string; last_name: string; email: string
  company?: string; custom_slug: string; status: string
}

interface EventData {
  id: string; title: string; slug: string; start_date: string; end_date: string; status: string
}

interface LinkData {
  id: string; affiliate_id: string; event_id: string; tracking_code: string
  clicks: number; custom_landing_html?: string; is_active: boolean
  events?: EventData
}

interface ReferralData {
  id: string; lead_first_name?: string; lead_last_name?: string; lead_email: string
  status: string; revenue: number; commission_amount: number; commission_paid: boolean
  created_at: string; events?: { title: string }
}

interface PromoTemplate {
  id: string; event_id: string; type: string; name: string
  subject_line?: string; preview_text?: string; body_content: string
  body_html?: string; platform?: string
}

// ─── Helpers ─────────────────────────────────────────────────────
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const TYPE_LABELS: Record<string, string> = {
  email_html: 'HTML Email',
  email_plain: 'Plain Text Email',
  email_affiliate: 'Affiliate Promo Email',
  sms: 'SMS / Text',
  social_media: 'Social Media',
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', facebook: '📘', linkedin: '💼', twitter: '𝕏', threads: '🧵', tiktok: '🎵', all: '🌐', email: '✉️', sms: '📱',
}

// ─── Social Share URLs ───────────────────────────────────────────
function getShareUrl(platform: string, text: string, url: string) {
  const encoded = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(url)
  switch (platform) {
    case 'twitter': return `https://twitter.com/intent/tweet?text=${encoded}&url=${encodedUrl}`
    case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encoded}`
    case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    case 'threads': return `https://www.threads.net/intent/post?text=${encoded}%20${encodedUrl}`
    default: return ''
  }
}

// ─── CSV Export ──────────────────────────────────────────────────
interface ExportConfig {
  columns: string[]
  headers: Record<string, string>
}

const ALL_EXPORT_COLUMNS = [
  { key: 'lead_first_name', label: 'First Name' },
  { key: 'lead_last_name', label: 'Last Name' },
  { key: 'lead_email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'commission_amount', label: 'Commission' },
  { key: 'commission_paid', label: 'Commission Paid' },
  { key: 'created_at', label: 'Date' },
  { key: 'event_title', label: 'Event' },
  { key: 'tracking_code', label: 'Tracking Code' },
]

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function PartnersPage() {
  // Auth state
  const [slug, setSlug] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Data
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [links, setLinks] = useState<LinkData[]>([])
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [templates, setTemplates] = useState<PromoTemplate[]>([])

  // UI state
  const [activeTab, setActiveTab] = useState<'promo' | 'leads' | 'landing' | 'links'>('promo')
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string>('')
  const [landingHtml, setLandingHtml] = useState('')
  const [savingLanding, setSavingLanding] = useState(false)
  const [previewLanding, setPreviewLanding] = useState(false)

  // Export config
  const [showExport, setShowExport] = useState(false)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    columns: ALL_EXPORT_COLUMNS.map(c => c.key),
    headers: Object.fromEntries(ALL_EXPORT_COLUMNS.map(c => [c.key, c.label])),
  })

  // FTC compliance agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const loadData = useCallback(async (affiliateSlug: string) => {
    const [affRes, linksRes, refsRes] = await Promise.all([
      fetch(`/api/affiliates?slug=${affiliateSlug}`),
      fetch(`/api/affiliates/links?slug=${affiliateSlug}`),
      fetch(`/api/affiliates/referrals?slug=${affiliateSlug}`),
    ])

    if (!affRes.ok) throw new Error('Affiliate not found')

    const affData = await affRes.json()
    const linksData = await linksRes.json()
    const refsData = await refsRes.json()

    setAffiliate(affData)
    setLinks(linksData)
    setReferrals(refsData)

    // Load templates for all events this affiliate has links for
    const eventIds = [...new Set(linksData.map((l: LinkData) => l.event_id))]
    const allTemplates: PromoTemplate[] = []
    for (const eid of eventIds) {
      const tRes = await fetch(`/api/promo-templates?event_id=${eid}`)
      if (tRes.ok) {
        const tData = await tRes.json()
        allTemplates.push(...tData)
      }
    }
    setTemplates(allTemplates)

    if (eventIds.length > 0) setSelectedEvent(eventIds[0] as string)
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await loadData(slug.trim().toLowerCase())
      setAuthenticated(true)
      setAgreedToTerms(true)
    } catch {
      setError('Partner account not found. Check your partner ID and try again.')
    }
    setLoading(false)
  }

  const handleCopy = (text: string, id: string) => {
    copyToClipboard(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(''), 2000)
  }

  const handleSaveLanding = async (linkId: string) => {
    setSavingLanding(true)
    await fetch('/api/affiliates/links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: affiliate?.custom_slug, link_id: linkId, custom_landing_html: landingHtml }),
    })
    setSavingLanding(false)
    await loadData(affiliate!.custom_slug)
  }

  const handleExportCSV = () => {
    const cols = exportConfig.columns.join(',')
    const headers = encodeURIComponent(JSON.stringify(exportConfig.headers))
    window.open(`/api/affiliates/export?slug=${affiliate?.custom_slug}&columns=${cols}&headers=${headers}`, '_blank')
  }

  // Drag reorder for export columns
  const moveColumn = (from: number, to: number) => {
    const cols = [...exportConfig.columns]
    const [item] = cols.splice(from, 1)
    cols.splice(to, 0, item)
    setExportConfig(prev => ({ ...prev, columns: cols }))
  }

  // ─── Replace merge tags ───────────────────────────────────────
  function personalizeTemplate(content: string): string {
    const link = links.find(l => l.event_id === selectedEvent)
    const trackingUrl = link ? `${SITE_URL}/api/affiliates/track?ref=${link.tracking_code}` : SITE_URL
    return content
      .replace(/\{\{affiliate_name\}\}/g, `${affiliate?.first_name} ${affiliate?.last_name}`)
      .replace(/\{\{affiliate_first_name\}\}/g, affiliate?.first_name || '')
      .replace(/\{\{tracking_link\}\}/g, trackingUrl)
      .replace(/\{\{workshop_link\}\}/g, `${SITE_URL}?ref=${link?.tracking_code || ''}`)
      .replace(/\{\{company\}\}/g, affiliate?.company || '')
  }

  // ─── Filtered templates ───────────────────────────────────────
  const filteredTemplates = templates.filter(t => {
    const matchEvent = !selectedEvent || t.event_id === selectedEvent
    const matchType = selectedTemplateType === 'all' || t.type === selectedTemplateType
    return matchEvent && matchType
  })

  const eventLink = links.find(l => l.event_id === selectedEvent)
  const trackingUrl = eventLink ? `${SITE_URL}/api/affiliates/track?ref=${eventLink.tracking_code}` : ''

  // Stats
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0)
  const totalLeads = referrals.length
  const totalRevenue = referrals.reduce((s, r) => s + (r.revenue || 0), 0)
  const totalCommission = referrals.reduce((s, r) => s + (r.commission_amount || 0), 0)

  // ═════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ═════════════════════════════════════════════════════════════
  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <div style={{ background: '#13131a', border: '1px solid rgba(108,58,237,0.25)', borderRadius: 16, padding: 40, maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            <span style={{ color: '#a78bfa' }}>Night</span> <span style={{ color: '#2dd4bf' }}>Vibe</span>
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 32 }}>Partner Portal</p>

          <p style={{ color: '#9ca3af', fontSize: 15, marginBottom: 24 }}>Enter your partner ID to access your promo materials, tracking links, and leads.</p>

          <input
            type="text"
            placeholder="Your Partner ID (e.g. john-doe)"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', padding: '12px 16px', background: '#1a1a2e', border: '1px solid rgba(108,58,237,0.3)', borderRadius: 10, color: '#fff', fontSize: 15, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
          />

          {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading || !slug.trim()}
            style={{ width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, #6c3aed, #a78bfa)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading || !slug.trim() ? 0.5 : 1 }}
          >
            {loading ? 'Loading...' : 'Access Partner Portal →'}
          </button>

          <p style={{ color: '#374151', fontSize: 11, marginTop: 24, lineHeight: 1.6 }}>
            Don&apos;t have a partner ID?<br />
            Contact <a href="mailto:dknightunicorn@gmail.com" style={{ color: '#a78bfa' }}>dknightunicorn@gmail.com</a> to join our affiliate program.
          </p>
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════
  // MAIN PORTAL
  // ═════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#fff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(108,58,237,0.12), rgba(45,212,191,0.06))', borderBottom: '1px solid rgba(108,58,237,0.15)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800 }}>
              <span style={{ color: '#a78bfa' }}>Night</span> <span style={{ color: '#2dd4bf' }}>Vibe</span>
            </span>
            <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Partner Portal</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: '#9ca3af', fontSize: 14 }}>Welcome, <strong style={{ color: '#fff' }}>{affiliate?.first_name}</strong></span>
            <button onClick={() => { setAuthenticated(false); setSlug('') }} style={{ padding: '6px 14px', background: 'transparent', border: '1px solid rgba(108,58,237,0.3)', borderRadius: 8, color: '#a78bfa', fontSize: 12, cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 60px' }}>
        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Clicks', value: totalClicks.toLocaleString(), color: '#a78bfa' },
            { label: 'Leads', value: totalLeads.toLocaleString(), color: '#2dd4bf' },
            { label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '#10b981' },
            { label: 'Commission', value: `$${totalCommission.toLocaleString()}`, color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#13131a', border: '1px solid rgba(108,58,237,0.15)', borderRadius: 12, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ color: stat.color, fontSize: 28, fontWeight: 800 }}>{stat.value}</div>
              <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Your Tracking Link */}
        {eventLink && (
          <div style={{ background: 'rgba(108,58,237,0.06)', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Your Tracking Link</div>
                <div style={{ color: '#fff', fontSize: 14, fontFamily: 'monospace', wordBreak: 'break-all' }}>{trackingUrl}</div>
              </div>
              <button
                onClick={() => handleCopy(trackingUrl, 'tracking-link')}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6c3aed, #a78bfa)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {copiedId === 'tracking-link' ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { key: 'promo' as const, label: '📧 Promo Templates' },
            { key: 'leads' as const, label: '👥 My Leads' },
            { key: 'landing' as const, label: '🌐 Landing Page' },
            { key: 'links' as const, label: '🔗 My Links' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                background: activeTab === tab.key ? 'linear-gradient(135deg, #6c3aed, #a78bfa)' : '#1a1a2e',
                color: activeTab === tab.key ? '#fff' : '#9ca3af',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Event selector */}
        {links.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#6b7280', fontSize: 12, display: 'block', marginBottom: 6 }}>SELECT EVENT</label>
            <select
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              style={{ padding: '10px 14px', background: '#1a1a2e', border: '1px solid rgba(108,58,237,0.3)', borderRadius: 10, color: '#fff', fontSize: 14, minWidth: 300 }}
            >
              {links.map(l => (
                <option key={l.id} value={l.event_id}>{l.events?.title || l.event_id}</option>
              ))}
            </select>
          </div>
        )}

        {/* ═══════════ PROMO TEMPLATES TAB ═══════════ */}
        {activeTab === 'promo' && (
          <div>
            {/* Type filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[{ key: 'all', label: 'All' }, ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ key: k, label: v }))].map(f => (
                <button
                  key={f.key}
                  onClick={() => setSelectedTemplateType(f.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(108,58,237,0.2)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: selectedTemplateType === f.key ? 'rgba(108,58,237,0.2)' : 'transparent',
                    color: selectedTemplateType === f.key ? '#a78bfa' : '#6b7280',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* FTC Disclosure Banner */}
            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <p style={{ color: '#f59e0b', fontSize: 12, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>⚠️ FTC Disclosure Required</p>
              <p style={{ color: '#9ca3af', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
                When promoting as an affiliate, you must disclose your relationship. Include language like: <em style={{ color: '#d1d5db' }}>&quot;I&apos;m an affiliate partner and may earn a commission if you sign up through my link.&quot;</em> All templates below include proper disclosure language.
              </p>
            </div>

            {filteredTemplates.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                No templates available yet for this event. Check back soon!
              </div>
            )}

            {filteredTemplates.map(template => (
              <div key={template.id} style={{ background: '#13131a', border: '1px solid rgba(108,58,237,0.15)', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
                {/* Template header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(108,58,237,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <span style={{ color: '#a78bfa', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginRight: 8 }}>
                      {PLATFORM_ICONS[template.platform || template.type] || '📄'} {TYPE_LABELS[template.type] || template.type}
                    </span>
                    <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>{template.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Copy content button */}
                    <button
                      onClick={() => handleCopy(personalizeTemplate(template.body_content), `copy-${template.id}`)}
                      style={{ padding: '8px 16px', background: 'rgba(108,58,237,0.15)', border: '1px solid rgba(108,58,237,0.3)', borderRadius: 8, color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {copiedId === `copy-${template.id}` ? '✓ Copied!' : '📋 Copy Content'}
                    </button>

                    {/* Copy HTML button (if HTML version exists) */}
                    {template.body_html && (
                      <button
                        onClick={() => handleCopy(personalizeTemplate(template.body_html!), `html-${template.id}`)}
                        style={{ padding: '8px 16px', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 8, color: '#2dd4bf', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        {copiedId === `html-${template.id}` ? '✓ Copied!' : '🔗 Copy HTML'}
                      </button>
                    )}

                    {/* Social share buttons */}
                    {(template.type === 'social_media') && (
                      <>
                        {['twitter', 'facebook', 'linkedin', 'threads'].map(platform => {
                          const url = getShareUrl(platform, personalizeTemplate(template.body_content), trackingUrl)
                          if (!url) return null
                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 8, color: '#9ca3af', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              {PLATFORM_ICONS[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </a>
                          )
                        })}
                      </>
                    )}
                  </div>
                </div>

                {/* Subject line (emails) */}
                {template.subject_line && (
                  <div style={{ padding: '10px 20px', background: 'rgba(108,58,237,0.04)', borderBottom: '1px solid rgba(108,58,237,0.06)' }}>
                    <span style={{ color: '#6b7280', fontSize: 11, marginRight: 8 }}>Subject:</span>
                    <span style={{ color: '#d1d5db', fontSize: 13 }}>{personalizeTemplate(template.subject_line)}</span>
                    <button
                      onClick={() => handleCopy(personalizeTemplate(template.subject_line!), `subj-${template.id}`)}
                      style={{ marginLeft: 8, padding: '2px 8px', background: 'transparent', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 4, color: '#6b7280', fontSize: 10, cursor: 'pointer' }}
                    >
                      {copiedId === `subj-${template.id}` ? '✓' : 'Copy'}
                    </button>
                  </div>
                )}

                {/* Content preview */}
                <div style={{ padding: 20 }}>
                  <pre style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, maxHeight: 300, overflow: 'auto' }}>
                    {personalizeTemplate(template.body_content)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════ LEADS TAB ═══════════ */}
        {activeTab === 'leads' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>Your Leads & Referrals</h2>
              <button
                onClick={() => setShowExport(!showExport)}
                style={{ padding: '10px 20px', background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 10, color: '#2dd4bf', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                📥 Export to CSV
              </button>
            </div>

            {/* Export Configuration */}
            {showExport && (
              <div style={{ background: '#13131a', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <h3 style={{ color: '#2dd4bf', fontSize: 14, fontWeight: 700, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1 }}>Export Settings</h3>

                <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 12 }}>Select columns and drag to reorder. Edit header names as needed.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {exportConfig.columns.map((col, idx) => {
                    const colDef = ALL_EXPORT_COLUMNS.find(c => c.key === col)
                    return (
                      <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a1a2e', padding: '8px 12px', borderRadius: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <button onClick={() => idx > 0 && moveColumn(idx, idx - 1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1 }}>▲</button>
                          <button onClick={() => idx < exportConfig.columns.length - 1 && moveColumn(idx, idx + 1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 10, padding: 0, lineHeight: 1 }}>▼</button>
                        </div>
                        <span style={{ color: '#6b7280', fontSize: 11, minWidth: 120 }}>{colDef?.label || col}</span>
                        <span style={{ color: '#4b5563', fontSize: 11 }}>→</span>
                        <input
                          type="text"
                          value={exportConfig.headers[col] || ''}
                          onChange={e => setExportConfig(prev => ({ ...prev, headers: { ...prev.headers, [col]: e.target.value } }))}
                          style={{ flex: 1, padding: '4px 8px', background: '#0a0a0f', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 6, color: '#fff', fontSize: 12 }}
                        />
                        <button
                          onClick={() => setExportConfig(prev => ({ ...prev, columns: prev.columns.filter(c => c !== col) }))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14 }}
                        >✕</button>
                      </div>
                    )
                  })}
                </div>

                {/* Add back removed columns */}
                {ALL_EXPORT_COLUMNS.filter(c => !exportConfig.columns.includes(c.key)).length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ color: '#6b7280', fontSize: 11, marginRight: 8 }}>Add column:</span>
                    {ALL_EXPORT_COLUMNS.filter(c => !exportConfig.columns.includes(c.key)).map(c => (
                      <button
                        key={c.key}
                        onClick={() => setExportConfig(prev => ({ ...prev, columns: [...prev.columns, c.key], headers: { ...prev.headers, [c.key]: c.label } }))}
                        style={{ padding: '4px 10px', background: 'rgba(108,58,237,0.1)', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 6, color: '#a78bfa', fontSize: 11, cursor: 'pointer', marginRight: 6, marginBottom: 4 }}
                      >
                        + {c.label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleExportCSV}
                  style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  📥 Download CSV
                </button>
              </div>
            )}

            {/* Leads table */}
            {referrals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                No leads yet. Share your tracking link to start getting referrals!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Name', 'Email', 'Status', 'Revenue', 'Commission', 'Date'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6b7280', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(108,58,237,0.1)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(ref => (
                      <tr key={ref.id} style={{ borderBottom: '1px solid rgba(108,58,237,0.06)' }}>
                        <td style={{ padding: '12px 16px', color: '#fff', fontSize: 14 }}>{ref.lead_first_name} {ref.lead_last_name}</td>
                        <td style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 13 }}>{ref.lead_email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: ref.status === 'purchased' ? 'rgba(16,185,129,0.15)' : ref.status === 'registered' ? 'rgba(108,58,237,0.15)' : 'rgba(107,114,128,0.15)',
                            color: ref.status === 'purchased' ? '#10b981' : ref.status === 'registered' ? '#a78bfa' : '#6b7280',
                          }}>
                            {ref.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontSize: 14, fontWeight: 600 }}>${ref.revenue}</td>
                        <td style={{ padding: '12px 16px', color: '#f59e0b', fontSize: 14, fontWeight: 600 }}>${ref.commission_amount}</td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 13 }}>{formatDate(ref.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════ LANDING PAGE BUILDER TAB ═══════════ */}
        {activeTab === 'landing' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Custom Landing Page</h2>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Create your own branded landing page. When someone visits your tracking link, they&apos;ll see your custom page instead of the default workshop page. Your tracking link still works — leads are still attributed to you.
            </p>

            {eventLink && (
              <div style={{ background: '#13131a', border: '1px solid rgba(108,58,237,0.15)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(108,58,237,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>HTML Editor — {eventLink.events?.title}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setPreviewLanding(!previewLanding)}
                      style={{ padding: '6px 14px', background: '#1a1a2e', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 8, color: '#9ca3af', fontSize: 12, cursor: 'pointer' }}
                    >
                      {previewLanding ? '📝 Editor' : '👁 Preview'}
                    </button>
                    <button
                      onClick={() => handleSaveLanding(eventLink.id)}
                      disabled={savingLanding}
                      style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #6c3aed, #a78bfa)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: savingLanding ? 0.5 : 1 }}
                    >
                      {savingLanding ? 'Saving...' : '💾 Save & Publish'}
                    </button>
                  </div>
                </div>

                {previewLanding ? (
                  <div style={{ padding: 20 }}>
                    <iframe
                      srcDoc={landingHtml || eventLink.custom_landing_html || '<p style="color:#6b7280;text-align:center;padding:40px;">No custom page yet. Paste your HTML in the editor.</p>'}
                      style={{ width: '100%', height: 500, border: '1px solid rgba(108,58,237,0.1)', borderRadius: 8, background: '#fff' }}
                      title="Landing page preview"
                    />
                  </div>
                ) : (
                  <div style={{ padding: 20 }}>
                    <textarea
                      value={landingHtml || eventLink.custom_landing_html || ''}
                      onChange={e => setLandingHtml(e.target.value)}
                      placeholder="Paste your custom HTML landing page here..."
                      style={{ width: '100%', minHeight: 400, padding: 16, background: '#0a0a0f', border: '1px solid rgba(108,58,237,0.2)', borderRadius: 10, color: '#d1d5db', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }}
                    />
                    <p style={{ color: '#4b5563', fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>
                      Tip: Include a link to <code style={{ color: '#a78bfa' }}>{SITE_URL}?ref={eventLink.tracking_code}</code> so leads register through your tracked link.
                      Your page must include an FTC affiliate disclosure.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ LINKS TAB ═══════════ */}
        {activeTab === 'links' && (
          <div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>Your Tracking Links</h2>

            {links.map(link => (
              <div key={link.id} style={{ background: '#13131a', border: '1px solid rgba(108,58,237,0.15)', borderRadius: 12, padding: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{link.events?.title || 'Event'}</div>
                    <div style={{ color: '#9ca3af', fontSize: 13, fontFamily: 'monospace' }}>
                      {SITE_URL}/api/affiliates/track?ref={link.tracking_code}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#a78bfa', fontSize: 14, fontWeight: 700 }}>{link.clicks} clicks</span>
                    <button
                      onClick={() => handleCopy(`${SITE_URL}/api/affiliates/track?ref=${link.tracking_code}`, `link-${link.id}`)}
                      style={{ padding: '8px 16px', background: 'rgba(108,58,237,0.15)', border: '1px solid rgba(108,58,237,0.3)', borderRadius: 8, color: '#a78bfa', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {copiedId === `link-${link.id}` ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer compliance */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(108,58,237,0.08)', textAlign: 'center' }}>
          <p style={{ color: '#374151', fontSize: 11, lineHeight: 1.8 }}>
            Night Vibe AI Partner Program · <a href="mailto:dknightunicorn@gmail.com" style={{ color: '#6b7280' }}>Support</a><br />
            By using this portal, you agree to the <a href="#" style={{ color: '#6b7280' }}>Affiliate Terms of Service</a> and <a href="#" style={{ color: '#6b7280' }}>FTC Disclosure Requirements</a>.<br />
            All promotional materials must include proper affiliate disclosure as required by the FTC.
          </p>
        </div>
      </div>
    </div>
  )
}
