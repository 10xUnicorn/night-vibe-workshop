import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function checkAuth(password: string) {
  return password === (process.env.ADMIN_PASSWORD || 'nightvibe2026')
}

function generateTrackingCode(): string {
  return 'nv-' + Math.random().toString(36).substring(2, 10)
}

// GET links for an affiliate
export async function GET(req: NextRequest) {
  const affiliateId = req.nextUrl.searchParams.get('affiliate_id')
  const slug = req.nextUrl.searchParams.get('slug')
  const password = req.nextUrl.searchParams.get('password') || ''

  const sb = getAdmin()

  // Affiliate self-lookup by slug
  if (slug) {
    const { data: affiliate } = await sb
      .from('affiliates')
      .select('id')
      .eq('custom_slug', slug)
      .eq('status', 'active')
      .single()

    if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: links } = await sb
      .from('affiliate_links')
      .select('*, events(id, title, slug, start_date, end_date, status)')
      .eq('affiliate_id', affiliate.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return NextResponse.json(links || [])
  }

  // Admin lookup
  if (!checkAuth(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const query = sb
    .from('affiliate_links')
    .select('*, affiliates(first_name, last_name, email), events(title, slug)')
    .order('created_at', { ascending: false })

  if (affiliateId) query.eq('affiliate_id', affiliateId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// CREATE link
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()

  const { data, error } = await sb.from('affiliate_links').insert({
    affiliate_id: body.affiliate_id,
    event_id: body.event_id,
    tracking_code: body.tracking_code || generateTrackingCode(),
    custom_landing_html: body.custom_landing_html || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// UPDATE link (save custom landing page HTML)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  // Allow affiliate to update their own landing page via slug
  const sb = getAdmin()

  if (body.slug) {
    const { data: affiliate } = await sb
      .from('affiliates')
      .select('id')
      .eq('custom_slug', body.slug)
      .eq('status', 'active')
      .single()

    if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data, error } = await sb
      .from('affiliate_links')
      .update({ custom_landing_html: body.custom_landing_html })
      .eq('id', body.link_id)
      .eq('affiliate_id', affiliate.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const updates: Record<string, unknown> = {}
  if (body.custom_landing_html !== undefined) updates.custom_landing_html = body.custom_landing_html
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const { data, error } = await sb
    .from('affiliate_links')
    .update(updates)
    .eq('id', body.link_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
