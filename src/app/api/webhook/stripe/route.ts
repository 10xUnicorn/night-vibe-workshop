import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { getRegistrationConfirmationEmail } from '@/lib/emailTemplates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This webhook receives Stripe checkout.session.completed events
// and increments the sold_count on the matching event ticket.
//
// To set up:
// 1. In Stripe Dashboard > Developers > Webhooks
// 2. Add endpoint: https://your-domain.vercel.app/api/webhook/stripe
// 3. Select event: checkout.session.completed
// 4. Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET env var
//
// For production, add signature verification using STRIPE_WEBHOOK_SECRET

async function sendRegistrationEmail(sb: ReturnType<typeof createClient>, eventId: string, customerEmail: string, customerName: string, amountPaid: number, currency: string) {
  try {
    // Fetch event details with hosts
    const { data: event } = await sb
      .from('events')
      .select('id, title, start_date, end_date, timezone')
      .eq('id', eventId)
      .single()

    if (!event) return

    // Fetch host names
    const { data: eventHosts } = await sb
      .from('event_hosts')
      .select('hosts(name)')
      .eq('event_id', eventId)
      .order('display_order')

    const hostNames = (eventHosts || [])
      .map((eh: { hosts: { name: string } | null }) => eh.hosts?.name)
      .filter(Boolean) as string[]

    // Insert registration record
    await sb.from('event_registrations').insert({
      event_id: eventId,
      customer_name: customerName || 'Attendee',
      customer_email: customerEmail,
      amount_paid: amountPaid,
      currency: currency || 'usd',
      product_name: event.title,
      status: 'confirmed',
    })

    // Send confirmation email
    const html = getRegistrationConfirmationEmail({
      customerName: customerName || 'there',
      eventTitle: event.title,
      startDate: event.start_date,
      endDate: event.end_date,
      timezone: event.timezone,
      hostNames,
      eventId: event.id,
      customerEmail,
    })

    const result = await sendEmail({
      to: customerEmail,
      subject: `You're In! ${event.title} — Registration Confirmed`,
      html,
    })

    // Log to sent_emails
    await sb.from('sent_emails').insert({
      email_type: 'registration_confirmation',
      recipient_email: customerEmail,
      event_id: eventId,
      subject: `You're In! ${event.title} — Registration Confirmed`,
      metadata: { customerName, eventTitle: event.title, hostNames },
      status: result.success ? 'sent' : 'failed',
    }).then(() => {}).catch(e => console.error('Email log error:', e))

    console.log(`Registration email ${result.success ? 'sent' : 'failed'} to ${customerEmail}`)
  } catch (err) {
    console.error('Registration email error (non-fatal):', err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle checkout.session.completed
    if (body.type === 'checkout.session.completed') {
      const session = body.data?.object
      const paymentLink = session?.payment_link
      const customerEmail = session?.customer_details?.email || session?.customer_email
      const customerName = session?.customer_details?.name || ''
      const amountPaid = (session?.amount_total || 0) / 100
      const currency = session?.currency || 'usd'

      if (!paymentLink) {
        return NextResponse.json({ received: true, action: 'no_payment_link' })
      }

      const sb = createClient(supabaseUrl, supabaseServiceKey)

      // Find ticket by stripe payment link (payment link ID from Stripe)
      // Stripe sends the payment_link ID, but we store the full URL
      // So we match by checking if the stored link contains the payment_link ID
      const { data: tickets } = await sb
        .from('event_tickets')
        .select('id, sold_count, capacity, event_id')
        .like('stripe_payment_link', `%${paymentLink}%`)

      if (tickets && tickets.length > 0) {
        const ticket = tickets[0]
        const newCount = (ticket.sold_count || 0) + 1

        await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', ticket.id)

        // Auto-mark as sold_out if at capacity
        if (newCount >= ticket.capacity) {
          await sb.from('events').update({ status: 'sold_out' }).eq('id', ticket.event_id)
          await sb.from('event_tickets').update({ status: 'sold_out' }).eq('id', ticket.id)
        }

        // Send registration confirmation email
        if (customerEmail) {
          await sendRegistrationEmail(sb, ticket.event_id, customerEmail, customerName, amountPaid, currency)
        }

        return NextResponse.json({ received: true, action: 'incremented', sold_count: newCount })
      }

      // Fallback: try matching by the full URL stored in events table
      const { data: events } = await sb
        .from('events')
        .select('id')
        .like('stripe_payment_link', `%${paymentLink}%`)

      if (events && events.length > 0) {
        const eventId = events[0].id
        const { data: eventTickets } = await sb
          .from('event_tickets')
          .select('id, sold_count, capacity')
          .eq('event_id', eventId)

        if (eventTickets && eventTickets.length > 0) {
          const ticket = eventTickets[0]
          const newCount = (ticket.sold_count || 0) + 1
          await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', ticket.id)

          if (newCount >= ticket.capacity) {
            await sb.from('events').update({ status: 'sold_out' }).eq('id', eventId)
          }

          // Send registration confirmation email
          if (customerEmail) {
            await sendRegistrationEmail(sb, eventId, customerEmail, customerName, amountPaid, currency)
          }

          return NextResponse.json({ received: true, action: 'incremented_via_event', sold_count: newCount })
        }
      }

      return NextResponse.json({ received: true, action: 'no_matching_ticket' })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
