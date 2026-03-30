import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// GET referrals — admin or affiliate self-lookup
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password') || ''
  const slug = req.nextUrl.searchParams.get('slug')
  const affiliateId = req.nextUrl.searchParams.get('affiliate_id')
  const eventId = req.nextUrl.searchParams.get('event_id')

  const sb = getAdmin()

  const email = req.nextUrl.searchParams.get('email')

  // Affiliate self-lookup by slug or email
  if (slug || email) {
    const query = sb.from('affiliates').select('id').eq('status', 'active')
    if (slug) query.eq('custom_slug', slug)
    else if (email) query.eq('email', email.trim().toLowerCase())
    const { data: affiliate } = await query.single()

    if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data } = await sb
      .from('affiliate_referrals')
      .select('id, lead_first_name, lead_last_name, lead_email, status, revenue, commission_amount, commission_paid, created_at, events(title)')
      .eq('affiliate_id', affiliate.id)
      .order('created_at', { ascending: false })

    return NextResponse.json(data || [])
  }

  // Admin
  if (!checkAuth(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = sb
    .from('affiliate_referrals')
    .select('*, affiliates(first_name, last_name, email), events(title), affiliate_links(tracking_code)')
    .order('created_at', { ascending: false })

  if (affiliateId) query = query.eq('affiliate_id', affiliateId)
  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// PATCH — update referral status / commission
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.status) updates.status = body.status
  if (body.revenue !== undefined) updates.revenue = body.revenue
  if (body.commission_amount !== undefined) updates.commission_amount = body.commission_amount
  if (body.commission_paid !== undefined) {
    updates.commission_paid = body.commission_paid
    if (body.commission_paid) updates.commission_paid_at = new Date().toISOString()
  }

  const { data, error } = await sb
    .from('affiliate_referrals')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
