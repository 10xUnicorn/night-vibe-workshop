import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET — redirect tracking: increments click count and redirects to event page
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('ref')
  if (!code) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const sb = getAdmin()

  // Look up the tracking link
  const { data: link } = await sb
    .from('affiliate_links')
    .select('id, affiliate_id, event_id, tracking_code, clicks, custom_landing_html, events(slug)')
    .eq('tracking_code', code)
    .eq('is_active', true)
    .single()

  if (!link) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Increment click count
  await sb
    .from('affiliate_links')
    .update({ clicks: (link.clicks || 0) + 1 })
    .eq('id', link.id)

  // If they have a custom landing page, serve it
  if (link.custom_landing_html) {
    return new NextResponse(link.custom_landing_html, {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Otherwise redirect to the event page with ref param
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventSlug = (link as any).events?.slug as string | undefined
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop.nightvibe.me'
  const redirectUrl = eventSlug
    ? `${siteUrl}/events/${eventSlug}?ref=${code}`
    : `${siteUrl}?ref=${code}`

  return NextResponse.redirect(redirectUrl)
}

// POST — record a referral conversion (called when someone registers)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { tracking_code, lead_email, lead_first_name, lead_last_name, event_id, registration_id, revenue } = body

  if (!tracking_code || !lead_email) {
    return NextResponse.json({ error: 'tracking_code and lead_email required' }, { status: 400 })
  }

  const sb = getAdmin()

  // Look up the link
  const { data: link } = await sb
    .from('affiliate_links')
    .select('id, affiliate_id, event_id, affiliates(commission_rate)')
    .eq('tracking_code', tracking_code)
    .single()

  if (!link) {
    return NextResponse.json({ error: 'Invalid tracking code' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commissionRate = (link as any).affiliates?.commission_rate || 0
  const commissionAmount = revenue ? (revenue * commissionRate / 100) : 0

  // Check for duplicate
  const { data: existing } = await sb
    .from('affiliate_referrals')
    .select('id')
    .eq('affiliate_link_id', link.id)
    .eq('lead_email', lead_email)
    .single()

  if (existing) {
    // Update existing referral
    const { data, error } = await sb
      .from('affiliate_referrals')
      .update({
        status: revenue ? 'purchased' : 'registered',
        registration_id: registration_id || null,
        revenue: revenue || 0,
        commission_amount: commissionAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Create new referral
  const { data, error } = await sb.from('affiliate_referrals').insert({
    affiliate_link_id: link.id,
    affiliate_id: link.affiliate_id,
    event_id: event_id || link.event_id,
    lead_first_name: lead_first_name || null,
    lead_last_name: lead_last_name || null,
    lead_email,
    status: revenue ? 'purchased' : 'lead',
    registration_id: registration_id || null,
    revenue: revenue || 0,
    commission_amount: commissionAmount,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
