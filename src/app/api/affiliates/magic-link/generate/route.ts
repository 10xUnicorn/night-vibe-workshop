import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function checkAuth(password: string) {
  const adminPw = process.env.ADMIN_PASSWORD
  if (!adminPw) return false
  return password === adminPw
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

// POST: Admin generates a magic link for an affiliate (returns the link, doesn't email)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!checkAuth(body.password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const sb = getAdmin()

    const { data: affiliate, error } = await sb
      .from('affiliates')
      .select('id, first_name, last_name, email')
      .eq('email', body.email.trim().toLowerCase())
      .eq('status', 'active')
      .single()

    if (error || !affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    const token = generateMagicToken(affiliate.id)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop.nightvibe.me'
    const magicLink = `${siteUrl}/partners?magic=${token}`

    return NextResponse.json({ magic_link: magicLink })
  } catch (err) {
    console.error('Error generating magic link:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
