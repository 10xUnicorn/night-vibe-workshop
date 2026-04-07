'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function WorkshopReviewPage() {
  const [stars, setStars] = useState(5)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [review, setReview] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [reviewPrompt, setReviewPrompt] = useState('Share your experience at the Night Vibe workshop. What did you build? What was the impact?')

  useEffect(() => {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    sb.from('review_settings').select('review_prompt').single().then(({ data }) => {
      if (data?.review_prompt) setReviewPrompt(data.review_prompt)
    })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 5)
    setFiles(selected)
  }

  const handleSubmit = async () => {
    if (!name.trim() || !review.trim()) {
      setError('Name and review are required.')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Upload media files
      const mediaUrls: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data: uploadData, error: uploadError } = await sb.storage
          .from('review-media')
          .upload(path, file)
        if (!uploadError && uploadData) {
          const { data: urlData } = sb.storage.from('review-media').getPublicUrl(path)
          if (urlData?.publicUrl) mediaUrls.push(urlData.publicUrl)
        }
      }

      // Insert review
      const { error: insertError } = await sb.from('reviews').insert({
        name: name.trim(),
        company: company.trim() || null,
        review: review.trim(),
        stars,
        media_urls: mediaUrls,
        is_public: false,
        source: 'form',
      })

      if (insertError) throw new Error(insertError.message)

      // Send notification
      await fetch('/api/reviews/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, review, stars }),
      })

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0a1a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: 480,
        }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
          <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 800, color: 'white', marginBottom: 16 }}>
            Thank You!
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 32 }}>
            Your review has been submitted and will be reviewed before publishing. We appreciate you taking the time to share your experience!
          </p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              color: 'white',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Back to Night Vibe →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0a1a 100%)',
      padding: '60px 16px',
    }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: 12 }}>
            Night Vibe Workshop
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, color: 'white', margin: '0 0 16px' }}>
            Leave a Review
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
            {reviewPrompt}
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(139,92,246,0.2)',
          borderRadius: 20,
          padding: 'clamp(24px, 5vw, 40px)',
        }}>
          {/* Star rating */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rating *
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setStars(s)}
                  onMouseEnter={() => setHoveredStar(s)}
                  onMouseLeave={() => setHoveredStar(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 36,
                    padding: 4,
                    opacity: s <= (hoveredStar || stars) ? 1 : 0.3,
                    transition: 'opacity 0.15s, transform 0.15s',
                    transform: s <= (hoveredStar || stars) ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            <div style={{ fontSize: 13, color: '#a78bfa', marginTop: 8 }}>
              {stars === 5 ? 'Excellent!' : stars === 4 ? 'Great!' : stars === 3 ? 'Good' : stars === 2 ? 'Fair' : 'Poor'}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                color: 'white',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Company */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Company / Business <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="My Startup"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                color: 'white',
                fontSize: 15,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Review text */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Review *
            </label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              placeholder="Share what you built, what you learned, and the impact it had..."
              rows={5}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                color: 'white',
                fontSize: 15,
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.6,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6, textAlign: 'right' }}>
              {review.length} characters
            </div>
          </div>

          {/* Media upload */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Photos / Videos <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional, up to 5)</span>
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.04)',
              border: '2px dashed rgba(139,92,246,0.3)',
              borderRadius: 10,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 14,
              transition: 'border-color 0.2s',
            }}>
              <span style={{ fontSize: 20 }}>📎</span>
              {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'Click to upload images or videos'}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {files.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {files.map((f, i) => (
                  <span key={i} style={{ fontSize: 12, padding: '3px 10px', background: 'rgba(139,92,246,0.2)', borderRadius: 20, color: '#a78bfa' }}>
                    {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 14, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !review.trim()}
            style={{
              width: '100%',
              padding: '16px',
              background: submitting || !name.trim() || !review.trim()
                ? 'rgba(139,92,246,0.3)'
                : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
              cursor: submitting || !name.trim() || !review.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.02em',
            }}
          >
            {submitting ? 'Submitting...' : 'Submit Review ✓'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 16, marginBottom: 0 }}>
            Reviews are moderated before publishing. Your info is never sold or spammed.
          </p>
        </div>
      </div>
    </div>
  )
}
