import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Stripe webhook: checkout.session.completed
// Matches purchases to events via: stripe_product_id, stripe_price_id, or payment_link
//
// Setup:
// 1. Stripe Dashboard > Developers > Webhooks
// 2. Add endpoint: https://night-vibe-workshop.vercel.app/api/webhook/stripe
// 3. Select event: checkout.session.completed
// 4. Copy signing secret to STRIPE_WEBHOOK_SECRET env var in Vercel

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Log for debugging
    console.log('[Webhook] Received event:', body.type)

    if (body.type !== 'checkout.session.completed') {
      return NextResponse.json({ received: true })
    }

    const session = body.data?.object
    if (!session) {
      console.log('[Webhook] No session data')
      return NextResponse.json({ received: true, action: 'no_session' })
    }

    const paymentLinkId = session.payment_link || null // plink_xxx
    const lineItems = session.line_items?.data || []

    // Extract product and price IDs from line items (if expanded)
    let productId: string | null = null
    let priceId: string | null = null

    if (lineItems.length > 0) {
      priceId = lineItems[0].price?.id || null
      productId = lineItems[0].price?.product || null
    }

    console.log('[Webhook] paymentLink:', paymentLinkId, 'product:', productId, 'price:', priceId)

    const sb = createClient(supabaseUrl, supabaseServiceKey)

    // Strategy: try to match a ticket by multiple methods
    let matchedTicket: { id: string; sold_count: number; capacity: number; event_id: string } | null = null

    // Method 1: Match by stripe_product_id on event_tickets
    if (productId && !matchedTicket) {
      const { data } = await sb
        .from('event_tickets')
        .select('id, sold_count, capacity, event_id')
        .eq('stripe_product_id', productId)
        .limit(1)
      if (data && data.length > 0) {
        matchedTicket = data[0]
        console.log('[Webhook] Matched by product_id')
      }
    }

    // Method 2: Match by stripe_price_id on event_tickets
    if (priceId && !matchedTicket) {
      const { data } = await sb
        .from('event_tickets')
        .select('id, sold_count, capacity, event_id')
        .eq('stripe_price_id', priceId)
        .limit(1)
      if (data && data.length > 0) {
        matchedTicket = data[0]
        console.log('[Webhook] Matched by price_id')
      }
    }

    // Method 3: Match by stripe_product_id on events table
    if (productId && !matchedTicket) {
      const { data: events } = await sb
        .from('events')
        .select('id')
        .eq('stripe_product_id', productId)
        .limit(1)
      if (events && events.length > 0) {
        const { data: tickets } = await sb
          .from('event_tickets')
          .select('id, sold_count, capacity, event_id')
          .eq('event_id', events[0].id)
          .limit(1)
        if (tickets && tickets.length > 0) {
          matchedTicket = tickets[0]
          console.log('[Webhook] Matched by events.stripe_product_id')
        }
      }
    }

    // Method 4: Match by payment_link ID stored in event_tickets or events
    // The DB stores full URLs, so we check if the URL contains the plink ID
    if (paymentLinkId && !matchedTicket) {
      // Also try matching the payment link URL directly
      const { data: allTickets } = await sb
        .from('event_tickets')
        .select('id, sold_count, capacity, event_id, stripe_payment_link')
        .not('stripe_payment_link', 'is', null)

      if (allTickets) {
        for (const t of allTickets) {
          // Match if the stored URL contains the plink ID, or if stored as just the ID
          if (t.stripe_payment_link === paymentLinkId ||
              t.stripe_payment_link?.includes(paymentLinkId)) {
            matchedTicket = t
            console.log('[Webhook] Matched by payment_link in tickets')
            break
          }
        }
      }

      // Also check events table
      if (!matchedTicket) {
        const { data: allEvents } = await sb
          .from('events')
          .select('id, stripe_payment_link')
          .not('stripe_payment_link', 'is', null)

        if (allEvents) {
          for (const e of allEvents) {
            if (e.stripe_payment_link === paymentLinkId ||
                e.stripe_payment_link?.includes(paymentLinkId)) {
              const { data: tickets } = await sb
                .from('event_tickets')
                .select('id, sold_count, capacity, event_id')
                .eq('event_id', e.id)
                .limit(1)
              if (tickets && tickets.length > 0) {
                matchedTicket = tickets[0]
                console.log('[Webhook] Matched by payment_link in events')
                break
              }
            }
          }
        }
      }
    }

    if (!matchedTicket) {
      console.log('[Webhook] No matching ticket found')
      return NextResponse.json({ received: true, action: 'no_matching_ticket' })
    }

    // Increment sold count
    const newCount = (matchedTicket.sold_count || 0) + 1
    await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', matchedTicket.id)

    // Auto-mark sold_out if at capacity
    if (newCount >= matchedTicket.capacity) {
      await sb.from('events').update({ status: 'sold_out' }).eq('id', matchedTicket.event_id)
      await sb.from('event_tickets').update({ status: 'sold_out' }).eq('id', matchedTicket.id)
    }

    // Get event title for registration record
    const { data: eventData } = await sb
      .from('events')
      .select('title')
      .eq('id', matchedTicket.event_id)
      .single()

    // Store registrant data
    const customerName = session.customer_details?.name || session.customer_name || ''
    const customerEmail = session.customer_details?.email || session.customer_email || ''
    const customerPhone = session.customer_details?.phone || session.customer_phone || ''

    const { error: regError } = await sb.from('event_registrations').insert({
      event_id: matchedTicket.event_id,
      ticket_id: matchedTicket.id,
      stripe_session_id: session.id,
      stripe_payment_link: paymentLinkId || '',
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      amount_paid: session.amount_total || 0,
      currency: session.currency || 'usd',
      product_name: eventData?.title || 'Workshop Seat',
      status: 'completed',
    })

    if (regError) {
      console.error('[Webhook] Registration insert error:', regError)
    }

    console.log('[Webhook] Success — registered', customerEmail, 'sold_count:', newCount)
    return NextResponse.json({ received: true, action: 'registered', sold_count: newCount })

  } catch (err) {
    console.error('[Webhook] Error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
