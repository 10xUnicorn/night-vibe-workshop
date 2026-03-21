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

// CREATE event + ticket
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()

  // Create event
  const { data: ev, error: evErr } = await sb.from('events').insert({
    title: body.title,
    slug: body.slug,
    subtitle: body.subtitle || null,
    event_type: 'workshop',
    start_date: new Date(body.start_date).toISOString(),
    end_date: new Date(body.end_date).toISOString(),
    timezone: body.timezone || 'America/Los_Angeles',
    capacity: body.capacity || 20,
    status: 'draft',
    is_featured: body.is_featured || false,
    stripe_payment_link: body.stripe_payment_link || null,
    landing_page_data: {
      hero_headlines: [body.title],
      special_offer: body.special_offer || '',
      instructor_name: body.instructor_name || 'Daniel Knight',
      company_name: body.company_name || 'Night Vibe',
      company_tagline: 'AI App Development Company',
    },
  }).select().single()

  if (evErr) {
    return NextResponse.json({ error: evErr.message }, { status: 500 })
  }

  // Create ticket
  const { error: tkErr } = await sb.from('event_tickets').insert({
    event_id: ev.id,
    name: 'Workshop Seat',
    price: body.price || 997,
    currency: 'usd',
    capacity: body.capacity || 20,
    sold_count: 0,
    stripe_payment_link: body.stripe_payment_link || null,
    status: 'active',
    includes: JSON.stringify([
      'Live 2-day build sprint',
      'Functional app built during workshop',
      'Full recording access',
      'SOPs and procedures',
      'The 3-Step AI App Blueprint',
      'Community access',
      'Future session access',
    ]),
  })

  if (tkErr) {
    return NextResponse.json({ error: tkErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, event: ev })
}

// UPDATE event or ticket
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()

  // Update ticket sold_count
  if (body.ticket_id && body.sold_count !== undefined) {
    const { error } = await sb.from('event_tickets').update({ sold_count: body.sold_count }).eq('id', body.ticket_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Update event fields
  if (body.id) {
    const updates: Record<string, unknown> = {}
    if (body.status !== undefined) updates.status = body.status
    if (body.is_featured !== undefined) updates.is_featured = body.is_featured
    if (body.title !== undefined) updates.title = body.title

    const { error } = await sb.from('events').update(updates).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Missing id or ticket_id' }, { status: 400 })
}
