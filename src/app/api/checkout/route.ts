import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil' as any,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop.nightvibe.me'

// Reusable product ID — created once, used for all events
const WORKSHOP_PRODUCT_ID = process.env.STRIPE_WORKSHOP_PRODUCT_ID || 'prod_UGsOJpZKMpFXRF'

export async function POST(req: NextRequest) {
  try {
    const { event_id, ref_code } = await req.json()

    if (!event_id) {
      return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    }

    // Fetch event + ticket info
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, start_date, end_date, timezone, status')
      .eq('id', event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.status === 'sold_out') {
      return NextResponse.json({ error: 'Event is sold out' }, { status: 400 })
    }

    // Get ticket for this event
    const { data: ticket } = await supabase
      .from('event_tickets')
      .select('id, price, capacity, sold_count, status')
      .eq('event_id', event_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'No ticket found for this event' }, { status: 404 })
    }

    if (ticket.status === 'sold_out' || (ticket.sold_count || 0) >= ticket.capacity) {
      return NextResponse.json({ error: 'Sold out' }, { status: 400 })
    }

    const priceInCents = Math.round(Number(ticket.price) * 100)

    // Format event date for checkout description
    const startDate = new Date(event.start_date)
    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // Create Stripe Checkout Session dynamically
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      allow_promotion_codes: true, // Enables coupon/promo code field at checkout
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product: WORKSHOP_PRODUCT_ID,
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        event_id: event.id,
        event_title: event.title,
        ticket_id: ticket.id,
        ref_code: ref_code || '',
      },
      custom_text: {
        submit: {
          message: `You're registering for: ${event.title} — ${dateStr}`,
        },
      },
      success_url: `${SITE_URL}?registered=true&event=${event_id}`,
      cancel_url: `${SITE_URL}?cancelled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
