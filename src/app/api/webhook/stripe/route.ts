import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This webhook receives Stripe checkout.session.completed events
// and increments the sold_count on the matching event ticket,
// PLUS stores full registrant data in event_registrations.
//
// To set up:
// 1. In Stripe Dashboard > Developers > Webhooks
// 2. Add endpoint: https://your-domain.vercel.app/api/webhook/stripe
// 3. Select event: checkout.session.completed
// 4. Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET env var

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type === 'checkout.session.completed') {
      const session = body.data?.object
      const paymentLink = session?.payment_link

      if (!paymentLink) {
        return NextResponse.json({ received: true, action: 'no_payment_link' })
      }

      const sb = createClient(supabaseUrl, supabaseServiceKey)

      // Find ticket by stripe payment link ID
      const { data: tickets } = await sb
        .from('event_tickets')
        .select('id, sold_count, capacity, event_id')
        .like('stripe_payment_link', `%${paymentLink}%`)

      let matchedTicket: { id: string; sold_count: number; capacity: number; event_id: string } | null = null

      if (tickets && tickets.length > 0) {
        matchedTicket = tickets[0]
      } else {
        // Fallback: try matching via events table
        const { data: events } = await sb
          .from('events')
          .select('id')
          .like('stripe_payment_link', `%${paymentLink}%`)

        if (events && events.length > 0) {
          const { data: eventTickets } = await sb
            .from('event_tickets')
            .select('id, sold_count, capacity, event_id')
            .eq('event_id', events[0].id)

          if (eventTickets && eventTickets.length > 0) {
            matchedTicket = eventTickets[0]
          }
        }
      }

      if (matchedTicket) {
        const newCount = (matchedTicket.sold_count || 0) + 1

        // Increment sold count
        await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', matchedTicket.id)

        // Auto-mark sold_out
        if (newCount >= matchedTicket.capacity) {
          await sb.from('events').update({ status: 'sold_out' }).eq('id', matchedTicket.event_id)
          await sb.from('event_tickets').update({ status: 'sold_out' }).eq('id', matchedTicket.id)
        }

        // Get event + product info for registration record
        const { data: eventData } = await sb
          .from('events')
          .select('title')
          .eq('id', matchedTicket.event_id)
          .single()

        // Store registrant data
        const customerName = session.customer_details?.name || session.customer_name || ''
        const customerEmail = session.customer_details?.email || session.customer_email || ''
        const customerPhone = session.customer_details?.phone || session.customer_phone || ''

        await sb.from('event_registrations').insert({
          event_id: matchedTicket.event_id,
          ticket_id: matchedTicket.id,
          stripe_session_id: session.id,
          stripe_payment_link: paymentLink,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          amount_paid: session.amount_total || 0,
          currency: session.currency || 'usd',
          product_name: eventData?.title || 'Workshop Seat',
          status: 'completed',
        })

        return NextResponse.json({ received: true, action: 'registered', sold_count: newCount })
      }

      return NextResponse.json({ received: true, action: 'no_matching_ticket' })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
