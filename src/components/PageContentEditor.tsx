'use client'

import { useState, useEffect } from 'react'
import { getLandingContent, DEFAULT_LANDING_PAGE_CONTENT, type LandingPageContent, type ProblemItem, type RoadmapStep, type ToolItem, type ComparisonRow, type BuildItem, type FaqItem } from '@/lib/landingPageDefaults'

interface EventOption {
  id: string
  title: string
  start_date: string
  landing_page_data: Partial<LandingPageContent>
}

interface Props {
  events: EventOption[]
  password: string
  onSaved: () => void
}

type SectionKey = 'video' | 'problem' | 'transformation' | 'comparison' | 'build' | 'roadmap' | 'calculator' | 'tools' | 'audience' | 'faq' | 'pricing' | 'final_cta'

export default function PageContentEditor({ events, password, onSaved }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [content, setContent] = useState<LandingPageContent>(DEFAULT_LANDING_PAGE_CONTENT)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set())

  const selectedEvent = events.find(e => e.id === selectedEventId)

  useEffect(() => {
    if (selectedEvent) {
      setContent(getLandingContent(selectedEvent.landing_page_data))
    }
  }, [selectedEventId])

  const toggleSection = (key: SectionKey) => {
    const next = new Set(openSections)
    next.has(key) ? next.delete(key) : next.add(key)
    setOpenSections(next)
  }

  const handleSave = async () => {
    if (!selectedEventId) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedEventId,
          password,
          landing_page_data: content,
        }),
      })
      if (res.ok) {
        setMsg('Page content saved!')
        onSaved()
      } else {
        const err = await res.json()
        setMsg(err.error || 'Failed to save')
      }
    } catch {
      setMsg('Network error')
    }
    setSaving(false)
  }

  const handleResetSection = (sectionKey: keyof LandingPageContent) => {
    setContent(prev => ({ ...prev, [sectionKey]: (DEFAULT_LANDING_PAGE_CONTENT as any)[sectionKey] }))
  }

  // Styles
  const labelStyle: React.CSSProperties = { fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 600 }
  const sectionHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '16px 20px', background: 'rgba(108,58,237,0.05)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 8 }
  const sectionBodyStyle: React.CSSProperties = { padding: '16px 20px', marginBottom: 16 }
  const resetBtnStyle: React.CSSProperties = { fontSize: 11, padding: '4px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer' }
  const addBtnStyle: React.CSSProperties = { fontSize: 13, padding: '8px 16px', background: 'rgba(45,212,191,0.1)', color: 'var(--teal)', border: '1px solid rgba(45,212,191,0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }
  const removeBtnStyle: React.CSSProperties = { fontSize: 11, padding: '4px 10px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer' }

  const SectionHeader = ({ sectionKey, title, icon }: { sectionKey: SectionKey; title: string; icon: string }) => {
    const enabled = content.sections_enabled[sectionKey]
    return (
      <div style={sectionHeaderStyle} onClick={() => toggleSection(sectionKey)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            onClick={e => {
              e.stopPropagation()
              setContent(p => ({
                ...p,
                sections_enabled: { ...p.sections_enabled, [sectionKey]: !p.sections_enabled[sectionKey] }
              }))
            }}
            title={enabled ? 'Click to hide this section on the event page' : 'Click to show this section on the event page'}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 20, background: enabled ? 'rgba(45,212,191,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${enabled ? 'rgba(45,212,191,0.3)' : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.2s' }}
          >
            <div style={{ width: 36, height: 20, borderRadius: 10, background: enabled ? 'var(--teal)' : 'rgba(255,255,255,0.15)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: enabled ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: enabled ? 'var(--teal)' : 'var(--text-muted)', minWidth: 24 }}>{enabled ? 'ON' : 'OFF'}</span>
          </div>
          <span style={{ fontSize: 18, color: 'var(--text-muted)', transform: openSections.has(sectionKey) ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
        </div>
      </div>
    )
  }

  if (!selectedEventId) {
    return (
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Page Content Editor</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>Select an event to customize its landing page sections.</p>
        <div style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
          {events.map(ev => (
            <button key={ev.id} onClick={() => setSelectedEventId(ev.id)} style={{
              padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer',
              textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{ev.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(ev.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <span style={{ color: 'var(--accent-light)', fontSize: 20 }}>→</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={() => { setSelectedEventId(''); setMsg('') }} style={{ fontSize: 13, color: 'var(--accent-light)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8 }}>← Back to events</button>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Edit: {selectedEvent?.title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 13, color: msg.includes('saved') ? 'var(--success)' : 'var(--danger)' }}>{msg}</span>}
          <button onClick={handleSave} disabled={saving} className="admin-btn" style={{ padding: '12px 32px' }}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* ===== VIDEO SECTION ===== */}
      <SectionHeader sectionKey="video" title="Video Embed" icon="🎬" />
      {openSections.has('video') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => { setContent(p => ({ ...p, video_url: DEFAULT_LANDING_PAGE_CONTENT.video_url, video_title: DEFAULT_LANDING_PAGE_CONTENT.video_title })) }}>Reset to Default</button>
          </div>
          <label style={labelStyle}>YouTube Embed URL</label>
          <input className="admin-input" value={content.video_url} onChange={e => setContent(p => ({ ...p, video_url: e.target.value }))} placeholder="https://www.youtube.com/embed/..." style={{ marginBottom: 12 }} />
          <label style={labelStyle}>Video Title (accessibility)</label>
          <input className="admin-input" value={content.video_title} onChange={e => setContent(p => ({ ...p, video_title: e.target.value }))} />
        </div>
      )}

      {/* ===== PROBLEM SECTION ===== */}
      <SectionHeader sectionKey="problem" title="The Problem" icon="⚠️" />
      {openSections.has('problem') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('problem_section')}>Reset to Default</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Section Label</label>
              <input className="admin-input" value={content.problem_section.label} onChange={e => setContent(p => ({ ...p, problem_section: { ...p.problem_section, label: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Title (line 1)</label>
              <input className="admin-input" value={content.problem_section.title} onChange={e => setContent(p => ({ ...p, problem_section: { ...p.problem_section, title: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Subtitle (line 2)</label>
              <input className="admin-input" value={content.problem_section.subtitle} onChange={e => setContent(p => ({ ...p, problem_section: { ...p.problem_section, subtitle: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Bottom Warning Text</label>
              <input className="admin-input" value={content.problem_section.bottom_text} onChange={e => setContent(p => ({ ...p, problem_section: { ...p.problem_section, bottom_text: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Problem Cards</label>
              {content.problem_section.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 80px 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="admin-input" value={item.icon} onChange={e => { const items = [...content.problem_section.items]; items[i] = { ...items[i], icon: e.target.value }; setContent(p => ({ ...p, problem_section: { ...p.problem_section, items } })) }} placeholder="Icon" style={{ textAlign: 'center' }} />
                  <input className="admin-input" value={item.title} onChange={e => { const items = [...content.problem_section.items]; items[i] = { ...items[i], title: e.target.value }; setContent(p => ({ ...p, problem_section: { ...p.problem_section, items } })) }} placeholder="Title" />
                  <input className="admin-input" value={item.desc} onChange={e => { const items = [...content.problem_section.items]; items[i] = { ...items[i], desc: e.target.value }; setContent(p => ({ ...p, problem_section: { ...p.problem_section, items } })) }} placeholder="Description" />
                  <select className="admin-input" value={item.glow} onChange={e => { const items = [...content.problem_section.items]; items[i] = { ...items[i], glow: e.target.value as 'purple' | 'teal' }; setContent(p => ({ ...p, problem_section: { ...p.problem_section, items } })) }} style={{ padding: '8px' }}>
                    <option value="purple">Purple</option>
                    <option value="teal">Teal</option>
                  </select>
                  <button style={removeBtnStyle} onClick={() => { const items = content.problem_section.items.filter((_, idx) => idx !== i); setContent(p => ({ ...p, problem_section: { ...p.problem_section, items } })) }}>✕</button>
                </div>
              ))}
              <button style={addBtnStyle} onClick={() => setContent(p => ({ ...p, problem_section: { ...p.problem_section, items: [...p.problem_section.items, { icon: '💡', title: '', desc: '', glow: 'purple' }] } }))}>+ Add Problem Card</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TRANSFORMATION SECTION ===== */}
      <SectionHeader sectionKey="transformation" title="Transformation (Before/After)" icon="✨" />
      {openSections.has('transformation') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('transformation_section')}>Reset to Default</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Section Label</label>
              <input className="admin-input" value={content.transformation_section.label} onChange={e => setContent(p => ({ ...p, transformation_section: { ...p.transformation_section, label: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Title</label>
              <input className="admin-input" value={content.transformation_section.title} onChange={e => setContent(p => ({ ...p, transformation_section: { ...p.transformation_section, title: e.target.value } }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>Before Items (one per line)</label>
                <textarea className="admin-input" value={content.transformation_section.before_items.join('\n')} onChange={e => setContent(p => ({ ...p, transformation_section: { ...p.transformation_section, before_items: e.target.value.split('\n').filter(Boolean) } }))} style={{ minHeight: 200 }} />
              </div>
              <div>
                <label style={labelStyle}>After Items (one per line)</label>
                <textarea className="admin-input" value={content.transformation_section.after_items.join('\n')} onChange={e => setContent(p => ({ ...p, transformation_section: { ...p.transformation_section, after_items: e.target.value.split('\n').filter(Boolean) } }))} style={{ minHeight: 200 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== COMPARISON SECTION ===== */}
      <SectionHeader sectionKey="comparison" title="Why This Is Different (Comparison)" icon="📊" />
      {openSections.has('comparison') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('comparison_section')}>Reset to Default</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input className="admin-input" value={content.comparison_section.title} onChange={e => setContent(p => ({ ...p, comparison_section: { ...p.comparison_section, title: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input className="admin-input" value={content.comparison_section.subtitle} onChange={e => setContent(p => ({ ...p, comparison_section: { ...p.comparison_section, subtitle: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Comparison Rows</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Feature</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Typical Course</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>This Workshop</span>
                <span />
              </div>
              {content.comparison_section.rows.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: 8, marginBottom: 8 }}>
                  <input className="admin-input" value={row.feature} onChange={e => { const rows = [...content.comparison_section.rows]; rows[i] = { ...rows[i], feature: e.target.value }; setContent(p => ({ ...p, comparison_section: { ...p.comparison_section, rows } })) }} />
                  <input className="admin-input" value={row.typical} onChange={e => { const rows = [...content.comparison_section.rows]; rows[i] = { ...rows[i], typical: e.target.value }; setContent(p => ({ ...p, comparison_section: { ...p.comparison_section, rows } })) }} />
                  <input className="admin-input" value={row.ours} onChange={e => { const rows = [...content.comparison_section.rows]; rows[i] = { ...rows[i], ours: e.target.value }; setContent(p => ({ ...p, comparison_section: { ...p.comparison_section, rows } })) }} />
                  <button style={removeBtnStyle} onClick={() => { const rows = content.comparison_section.rows.filter((_, idx) => idx !== i); setContent(p => ({ ...p, comparison_section: { ...p.comparison_section, rows } })) }}>✕</button>
                </div>
              ))}
              <button style={addBtnStyle} onClick={() => setContent(p => ({ ...p, comparison_section: { ...p.comparison_section, rows: [...p.comparison_section.rows, { feature: '', typical: '', ours: '' }] } }))}>+ Add Row</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BUILD SECTION ===== */}
      <SectionHeader sectionKey="build" title="What You Will Build" icon="🛠" />
      {openSections.has('build') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('build_section')}>Reset to Default</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input className="admin-input" value={content.build_section.title} onChange={e => setContent(p => ({ ...p, build_section: { ...p.build_section, title: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input className="admin-input" value={content.build_section.subtitle} onChange={e => setContent(p => ({ ...p, build_section: { ...p.build_section, subtitle: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Build Cards</label>
              {content.build_section.items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="admin-input" value={item.icon} onChange={e => { const items = [...content.build_section.items]; items[i] = { ...items[i], icon: e.target.value }; setContent(p => ({ ...p, build_section: { ...p.build_section, items } })) }} style={{ textAlign: 'center' }} />
                  <input className="admin-input" value={item.title} onChange={e => { const items = [...content.build_section.items]; items[i] = { ...items[i], title: e.target.value }; setContent(p => ({ ...p, build_section: { ...p.build_section, items } })) }} />
                  <select className="admin-input" value={item.glow} onChange={e => { const items = [...content.build_section.items]; items[i] = { ...items[i], glow: e.target.value as 'purple' | 'teal' }; setContent(p => ({ ...p, build_section: { ...p.build_section, items } })) }} style={{ padding: '8px' }}>
                    <option value="purple">Purple</option>
                    <option value="teal">Teal</option>
                  </select>
                  <button style={removeBtnStyle} onClick={() => { const items = content.build_section.items.filter((_, idx) => idx !== i); setContent(p => ({ ...p, build_section: { ...p.build_section, items } })) }}>✕</button>
                </div>
              ))}
              <button style={addBtnStyle} onClick={() => setContent(p => ({ ...p, build_section: { ...p.build_section, items: [...p.build_section.items, { icon: '🔧', title: '', glow: 'purple' }] } }))}>+ Add Card</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ROADMAP SECTION ===== */}
      <SectionHeader sectionKey="roadmap" title="Roadmap / Journey" icon="🗺" />
      {openSections.has('roadmap') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('roadmap_section')}>Reset to Default</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input className="admin-input" value={content.roadmap_section.title} onChange={e => setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, title: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Steps</label>
              {content.roadmap_section.steps.map((step, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 60px 1fr 2fr 90px 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="admin-input" value={step.num} onChange={e => { const steps = [...content.roadmap_section.steps]; steps[i] = { ...steps[i], num: e.target.value }; setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, steps } })) }} placeholder="#" style={{ textAlign: 'center' }} />
                  <input className="admin-input" value={step.icon} onChange={e => { const steps = [...content.roadmap_section.steps]; steps[i] = { ...steps[i], icon: e.target.value }; setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, steps } })) }} style={{ textAlign: 'center' }} />
                  <input className="admin-input" value={step.title} onChange={e => { const steps = [...content.roadmap_section.steps]; steps[i] = { ...steps[i], title: e.target.value }; setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, steps } })) }} placeholder="Title" />
                  <input className="admin-input" value={step.desc} onChange={e => { const steps = [...content.roadmap_section.steps]; steps[i] = { ...steps[i], desc: e.target.value }; setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, steps } })) }} placeholder="Description" />
                  <input className="admin-input" type="color" value={step.color} onChange={e => { const steps = [...content.roadmap_section.steps]; steps[i] = { ...steps[i], color: e.target.value }; setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, steps } })) }} style={{ padding: 4, height: 38 }} />
                  <button style={removeBtnStyle} onClick={() => { const steps = content.roadmap_section.steps.filter((_, idx) => idx !== i); setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, steps } })) }}>✕</button>
                </div>
              ))}
              <button style={addBtnStyle} onClick={() => setContent(p => ({ ...p, roadmap_section: { ...p.roadmap_section, steps: [...p.roadmap_section.steps, { num: `0${p.roadmap_section.steps.length + 1}`, icon: '🎯', title: '', desc: '', color: '#8B5CF6' }] } }))}>+ Add Step</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CALCULATOR TOGGLE ===== */}
      <SectionHeader sectionKey="calculator" title="Revenue Calculator" icon="💰" />
      {openSections.has('calculator') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Show Calculator</label>
            <input type="checkbox" checked={content.show_calculator} onChange={e => setContent(p => ({ ...p, show_calculator: e.target.checked }))} style={{ width: 20, height: 20 }} />
          </div>
          <div>
            <label style={labelStyle}>Section Title</label>
            <input className="admin-input" value={content.calculator_section.title} onChange={e => setContent(p => ({ ...p, calculator_section: { ...p.calculator_section, title: e.target.value } }))} style={{ marginBottom: 12 }} />
          </div>
          <div>
            <label style={labelStyle}>Subtitle</label>
            <input className="admin-input" value={content.calculator_section.subtitle} onChange={e => setContent(p => ({ ...p, calculator_section: { ...p.calculator_section, subtitle: e.target.value } }))} />
          </div>
        </div>
      )}

      {/* ===== TOOLS SECTION ===== */}
      <SectionHeader sectionKey="tools" title="Tool Stack" icon="🔧" />
      {openSections.has('tools') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('tools_section')}>Reset to Default</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input className="admin-input" value={content.tools_section.title} onChange={e => setContent(p => ({ ...p, tools_section: { ...p.tools_section, title: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input className="admin-input" value={content.tools_section.subtitle} onChange={e => setContent(p => ({ ...p, tools_section: { ...p.tools_section, subtitle: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Required Tools</label>
              {content.tools_section.required.map((tool, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 1fr 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="admin-input" value={tool.emoji} onChange={e => { const required = [...content.tools_section.required]; required[i] = { ...required[i], emoji: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, required } })) }} style={{ textAlign: 'center' }} />
                  <input className="admin-input" value={tool.name} onChange={e => { const required = [...content.tools_section.required]; required[i] = { ...required[i], name: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, required } })) }} placeholder="Name" />
                  <input className="admin-input" value={tool.cost} onChange={e => { const required = [...content.tools_section.required]; required[i] = { ...required[i], cost: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, required } })) }} placeholder="Cost" />
                  <input className="admin-input" value={tool.desc} onChange={e => { const required = [...content.tools_section.required]; required[i] = { ...required[i], desc: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, required } })) }} placeholder="Description" />
                  <button style={removeBtnStyle} onClick={() => { const required = content.tools_section.required.filter((_, idx) => idx !== i); setContent(p => ({ ...p, tools_section: { ...p.tools_section, required } })) }}>✕</button>
                </div>
              ))}
              <button style={addBtnStyle} onClick={() => setContent(p => ({ ...p, tools_section: { ...p.tools_section, required: [...p.tools_section.required, { emoji: '🔧', name: '', cost: 'Free', desc: '' }] } }))}>+ Add Required Tool</button>
            </div>
            <div>
              <label style={labelStyle}>Optional Tools</label>
              {content.tools_section.optional.map((tool, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 1fr 40px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="admin-input" value={tool.emoji} onChange={e => { const optional = [...content.tools_section.optional]; optional[i] = { ...optional[i], emoji: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, optional } })) }} style={{ textAlign: 'center' }} />
                  <input className="admin-input" value={tool.name} onChange={e => { const optional = [...content.tools_section.optional]; optional[i] = { ...optional[i], name: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, optional } })) }} placeholder="Name" />
                  <input className="admin-input" value={tool.cost} onChange={e => { const optional = [...content.tools_section.optional]; optional[i] = { ...optional[i], cost: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, optional } })) }} placeholder="Cost" />
                  <input className="admin-input" value={tool.desc} onChange={e => { const optional = [...content.tools_section.optional]; optional[i] = { ...optional[i], desc: e.target.value }; setContent(p => ({ ...p, tools_section: { ...p.tools_section, optional } })) }} placeholder="Description" />
                  <button style={removeBtnStyle} onClick={() => { const optional = content.tools_section.optional.filter((_, idx) => idx !== i); setContent(p => ({ ...p, tools_section: { ...p.tools_section, optional } })) }}>✕</button>
                </div>
              ))}
              <button style={addBtnStyle} onClick={() => setContent(p => ({ ...p, tools_section: { ...p.tools_section, optional: [...p.tools_section.optional, { emoji: '🔧', name: '', cost: 'Free', desc: '' }] } }))}>+ Add Optional Tool</button>
            </div>
            <div>
              <label style={labelStyle}>Budget Summary Text</label>
              <input className="admin-input" value={content.tools_section.budget_text} onChange={e => setContent(p => ({ ...p, tools_section: { ...p.tools_section, budget_text: e.target.value } }))} />
            </div>
          </div>
        </div>
      )}

      {/* ===== AUDIENCE SECTION ===== */}
      <SectionHeader sectionKey="audience" title="Who This Is For" icon="🎯" />
      {openSections.has('audience') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('audience_section')}>Reset to Default</button>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Title</label>
              <input className="admin-input" value={content.audience_section.title} onChange={e => setContent(p => ({ ...p, audience_section: { ...p.audience_section, title: e.target.value } }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={labelStyle}>This IS for you if... (one per line)</label>
                <textarea className="admin-input" value={content.audience_section.for_items.join('\n')} onChange={e => setContent(p => ({ ...p, audience_section: { ...p.audience_section, for_items: e.target.value.split('\n').filter(Boolean) } }))} style={{ minHeight: 200 }} />
              </div>
              <div>
                <label style={labelStyle}>This is NOT for you if... (one per line)</label>
                <textarea className="admin-input" value={content.audience_section.not_for_items.join('\n')} onChange={e => setContent(p => ({ ...p, audience_section: { ...p.audience_section, not_for_items: e.target.value.split('\n').filter(Boolean) } }))} style={{ minHeight: 200 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FAQ SECTION ===== */}
      <SectionHeader sectionKey="faq" title="FAQ" icon="❓" />
      {openSections.has('faq') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button style={resetBtnStyle} onClick={() => handleResetSection('faq_items')}>Reset to Default</button>
          </div>
          {content.faq_items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gap: 8, marginBottom: 16, padding: 16, background: 'rgba(108,58,237,0.03)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Q{i + 1}</label>
                <button style={removeBtnStyle} onClick={() => { const faq_items = content.faq_items.filter((_, idx) => idx !== i); setContent(p => ({ ...p, faq_items })) }}>Remove</button>
              </div>
              <input className="admin-input" value={item.q} onChange={e => { const faq_items = [...content.faq_items]; faq_items[i] = { ...faq_items[i], q: e.target.value }; setContent(p => ({ ...p, faq_items })) }} placeholder="Question" />
              <textarea className="admin-input" value={item.a} onChange={e => { const faq_items = [...content.faq_items]; faq_items[i] = { ...faq_items[i], a: e.target.value }; setContent(p => ({ ...p, faq_items })) }} placeholder="Answer" style={{ minHeight: 60 }} />
            </div>
          ))}
          <button style={addBtnStyle} onClick={() => setContent(p => ({ ...p, faq_items: [...p.faq_items, { q: '', a: '' }] }))}>+ Add FAQ</button>
        </div>
      )}

      {/* ===== PRICING SECTION ===== */}
      <SectionHeader sectionKey="pricing" title="Pricing Section Text" icon="💳" />
      {openSections.has('pricing') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Subtitle</label>
              <input className="admin-input" value={content.pricing_section.subtitle} onChange={e => setContent(p => ({ ...p, pricing_section: { ...p.pricing_section, subtitle: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Special Offer Title</label>
              <input className="admin-input" value={content.pricing_section.special_offer_title} onChange={e => setContent(p => ({ ...p, pricing_section: { ...p.pricing_section, special_offer_title: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Special Offer Text</label>
              <input className="admin-input" value={content.pricing_section.special_offer_text} onChange={e => setContent(p => ({ ...p, pricing_section: { ...p.pricing_section, special_offer_text: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Checkout Note</label>
              <input className="admin-input" value={content.pricing_section.checkout_note} onChange={e => setContent(p => ({ ...p, pricing_section: { ...p.pricing_section, checkout_note: e.target.value } }))} />
            </div>
          </div>
        </div>
      )}

      {/* ===== FINAL CTA ===== */}
      <SectionHeader sectionKey="final_cta" title="Final CTA" icon="🚀" />
      {openSections.has('final_cta') && (
        <div style={sectionBodyStyle}>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={labelStyle}>Headline</label>
              <input className="admin-input" value={content.final_cta.title} onChange={e => setContent(p => ({ ...p, final_cta: { ...p.final_cta, title: e.target.value } }))} />
            </div>
            <div>
              <label style={labelStyle}>Bottom Text</label>
              <input className="admin-input" value={content.final_cta.subtitle} onChange={e => setContent(p => ({ ...p, final_cta: { ...p.final_cta, subtitle: e.target.value } }))} />
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SAVE BAR */}
      <div style={{ position: 'sticky', bottom: 20, marginTop: 32, padding: '16px 24px', background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 24px rgba(108,58,237,0.2)' }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Editing: <strong style={{ color: 'var(--text-primary)' }}>{selectedEvent?.title}</strong></span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {msg && <span style={{ fontSize: 13, color: msg.includes('saved') ? 'var(--success)' : 'var(--danger)' }}>{msg}</span>}
          <button onClick={handleSave} disabled={saving} className="admin-btn" style={{ padding: '12px 32px' }}>
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
