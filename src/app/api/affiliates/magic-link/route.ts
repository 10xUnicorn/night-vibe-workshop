import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function generateMagicToken(affiliateId: string): string {
  const secret = process.env.ADMIN_PASSWORD || 'default-secret'
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  const timestamp = expiresAt.toString()
  const random = crypto.randomBytes(16).toString('hex')

  const message = `${affiliateId}|${timestamp}|${random}`
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex')

  const token = `${message}|${hmac}`
  return Buffer.from(token).toString('base64url')
}

function verifyMagicToken(token: string): { affiliateId: string; valid: boolean } {
  try {
    const secret = process.env.ADMIN_PASSWORD || 'default-secret'
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const parts = decoded.split('|')

    if (parts.length !== 4) return { affiliateId: '', valid: false }

    const [affiliateId, timestamp, random, providedHmac] = parts
    const message = `${affiliateId}|${timestamp}|${random}`
    const expectedHmac = crypto.createHmac('sha256', secret).update(message).digest('hex')

    if (providedHmac !== expectedHmac) return { affiliateId: '', valid: false }

    const expiresAt = parseInt(timestamp, 10)
    if (Date.now() > expiresAt) return { affiliateId: '', valid: false }

    return { affiliateId, valid: true }
  } catch {
    return { affiliateId: '', valid: false }
  }
}

// POST: Request magic link by email
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const sb = getAdmin()

    // Look up affiliate by email
    const { data: affiliate, error } = await sb
      .from('affiliates')
      .select('id, first_name, last_name, email')
      .eq('email', email.trim().toLowerCase())
      .eq('status', 'active')
      .single()

    if (error || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    // Generate magic token
    const token = generateMagicToken(affiliate.id)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop.nightvibe.me'
    const magicLink = `${siteUrl}/partners?magic=${token}`

    // Send email with magic link
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e0e0e0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #13131a; padding: 40px 20px; border-radius: 12px; border: 1px solid rgba(108,58,237,0.2); }
    .header { background: linear-gradient(135deg, #a78bfa 0%, #2dd4bf 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-size: 28px; margin-bottom: 30px; font-weight: 800; }
    .title { color: #a78bfa; font-size: 20px; margin: 20px 0; font-weight: 700; }
    .content { color: #d1d5db; line-height: 1.6; margin: 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #6c3aed, #a78bfa); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 700; font-size: 15px; }
    .link-box { background: #0a0a0f; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2dd4bf; }
    .link-text { color: #2dd4bf; word-break: break-all; font-size: 13px; font-family: 'Courier New', monospace; }
    .footer { color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid rgba(108,58,237,0.15); padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">✨ Night Vibe</div>
    <div class="title">Your Magic Link is Ready</div>

    <p class="content">Hi ${affiliate.first_name || 'there'},</p>

    <p class="content">Click the button below to access your partner portal. This link expires in 24 hours.</p>

    <a href="${magicLink}" class="button">Access Partner Portal</a>

    <p class="content">Or copy this link if the button doesn't work:</p>

    <div class="link-box">
      <div class="link-text">${magicLink}</div>
    </div>

    <p class="content" style="color: #9ca3af; font-size: 13px;">This is a one-time login link. For security, it will expire after 24 hours.</p>

    <div class="footer">
      <p>Questions? Contact us at partners@nightvibe.me</p>
      <p>© Night Vibe. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

    await sendEmail({
      to: affiliate.email,
      subject: '✨ Your Night Vibe Partner Portal Magic Link',
      html: emailHtml,
    }).catch(err => {
      console.error('Failed to send magic link email:', err)
    })

    return NextResponse.json({ success: true, message: 'Magic link sent to email' })
  } catch (err) {
    console.error('Error in magic link POST:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Verify magic link token
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Verify token
    const { affiliateId, valid } = verifyMagicToken(token)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Look up affiliate
    const sb = getAdmin()
    const { data: affiliate, error } = await sb
      .from('affiliates')
      .select('id, first_name, last_name, email, custom_slug, status')
      .eq('id', affiliateId)
      .eq('status', 'active')
      .single()

    if (error || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    return NextResponse.json(affiliate)
  } catch (err) {
    console.error('Error in magic link GET:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
