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

// UPDATE event or ticket — supports full event editing
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

  // Full event edit
  if (body.id) {
    const eventUpdates: Record<string, unknown> = {}
    const editableEventFields = ['title', 'slug', 'subtitle', 'start_date', 'end_date', 'timezone', 'capacity', 'status', 'is_featured', 'stripe_payment_link']

    for (const field of editableEventFields) {
      if (body[field] !== undefined) {
        if (field === 'start_date' || field === 'end_date') {
          eventUpdates[field] = new Date(body[field]).toISOString()
        } else {
          eventUpdates[field] = body[field]
        }
      }
    }

    // Update landing_page_data fields
    if (body.special_offer !== undefined || body.instructor_name !== undefined || body.company_name !== undefined) {
      const { data: existing } = await sb.from('events').select('landing_page_data').eq('id', body.id).single()
      const lpd = (existing?.landing_page_data as Record<string, unknown>) || {}
      if (body.special_offer !== undefined) lpd.special_offer = body.special_offer
      if (body.instructor_name !== undefined) lpd.instructor_name = body.instructor_name
      if (body.company_name !== undefined) lpd.company_name = body.company_name
      if (body.title !== undefined) lpd.hero_headlines = [body.title]
      eventUpdates.landing_page_data = lpd
    }

    if (Object.keys(eventUpdates).length > 0) {
      const { error } = await sb.from('events').update(eventUpdates).eq('id', body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Also update the associated ticket if price/capacity/payment link changed
    if (body.price !== undefined || body.capacity !== undefined || body.stripe_payment_link !== undefined) {
      const ticketUpdates: Record<string, unknown> = {}
      if (body.price !== undefined) ticketUpdates.price = body.price
      if (body.capacity !== undefined) ticketUpdates.capacity = body.capacity
      if (body.stripe_payment_link !== undefined) ticketUpdates.stripe_payment_link = body.stripe_payment_link

      await sb.from('event_tickets').update(ticketUpdates).eq('event_id', body.id)
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Missing id or ticket_id' }, { status: 400 })
}
