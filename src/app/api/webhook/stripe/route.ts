import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { sendEmail } from '@/lib/email'
import { getRegistrationConfirmationEmail } from '@/lib/emailTemplates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize Stripe for signature verification
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-03-31.basil' as Stripe.LatestApiVersion })
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendRegistrationEmail(sb: any, eventId: string, customerEmail: string, customerName: string, amountPaid: number, currency: string) {
  try {
    const { data: eventData } = await sb
      .from('events')
      .select('id, title, start_date, end_date, timezone, meeting_link')
      .eq('id', eventId)
      .single()

    const event = eventData as { id: string; title: string; start_date: string; end_date: string; timezone: string; meeting_link: string | null } | null
    if (!event) return

    const { data: eventHosts } = await sb
      .from('event_hosts')
      .select('hosts(name)')
      .eq('event_id', eventId)
      .order('display_order')

    const hostNames = (eventHosts || [])
      .map((eh: { hosts: { name: string } | null }) => eh.hosts?.name)
      .filter(Boolean) as string[]

    // Check for duplicate registration
    const { data: existing } = await sb
      .from('event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('customer_email', customerEmail)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`Duplicate registration skipped for ${customerEmail} on event ${eventId}`)
      return
    }

    // Insert registration record
    await sb.from('event_registrations').insert({
      event_id: eventId,
      customer_name: customerName || 'Attendee',
      customer_email: customerEmail,
      amount_paid: amountPaid,
      currency: currency || 'usd',
      product_name: event.title,
      status: 'confirmed',
    } as any)

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
      meetingLink: event.meeting_link || undefined,
    })

    const result = await sendEmail({
      to: customerEmail,
      subject: `You're In! ${event.title} — Registration Confirmed`,
      html,
    })

    // Log to sent_emails
    try {
      await sb.from('sent_emails').insert({
        email_type: 'registration_confirmation',
        recipient_email: customerEmail,
        event_id: eventId,
        subject: `You're In! ${event.title} — Registration Confirmed`,
        metadata: { customerName, eventTitle: event.title, hostNames },
        status: result.success ? 'sent' : 'failed',
      } as any)
    } catch (e) { console.error('Email log error:', e) }

    console.log(`Registration email ${result.success ? 'sent' : 'failed'} to ${customerEmail}`)
  } catch (err) {
    console.error('Registration email error (non-fatal):', err)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutCompleted(session: any) {
  const sb = createClient(supabaseUrl, supabaseServiceKey)

  const customerEmail = session.customer_details?.email || session.customer_email
  const customerName = session.customer_details?.name || ''
  const amountPaid = (session.amount_total || 0) / 100
  const currency = session.currency || 'usd'

  // --- PRIMARY: Get event_id from session metadata (new dynamic checkout flow) ---
  const eventId = session.metadata?.event_id
  const ticketId = session.metadata?.ticket_id
  const refCode = session.metadata?.ref_code

  if (eventId) {
    // Increment sold_count on the ticket
    if (ticketId) {
      const { data: ticket } = await sb
        .from('event_tickets')
        .select('id, sold_count, capacity, event_id')
        .eq('id', ticketId)
        .single()

      if (ticket) {
        const newCount = (ticket.sold_count || 0) + 1
        await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', ticket.id)

        if (newCount >= ticket.capacity) {
          await sb.from('events').update({ status: 'sold_out' }).eq('id', ticket.event_id)
          await sb.from('event_tickets').update({ status: 'sold_out' }).eq('id', ticket.id)
        }
      }
    } else {
      // No ticket_id in metadata — find ticket by event_id
      const { data: tickets } = await sb
        .from('event_tickets')
        .select('id, sold_count, capacity')
        .eq('event_id', eventId)
        .limit(1)

      if (tickets && tickets.length > 0) {
        const ticket = tickets[0]
        const newCount = (ticket.sold_count || 0) + 1
        await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', ticket.id)

        if (newCount >= ticket.capacity) {
          await sb.from('events').update({ status: 'sold_out' }).eq('id', eventId)
          await sb.from('event_tickets').update({ status: 'sold_out' }).eq('id', ticket.id)
        }
      }
    }

    // Track affiliate referral if ref_code present
    if (refCode) {
      try {
        const { data: affiliate } = await sb
          .from('affiliates')
          .select('id')
          .eq('slug', refCode)
          .single()

        if (affiliate) {
          await sb.from('affiliate_referrals').insert({
            affiliate_id: affiliate.id,
            event_id: eventId,
            customer_email: customerEmail,
            customer_name: customerName,
            amount: amountPaid,
            status: 'confirmed',
          } as any)
        }
      } catch (e) { console.error('Affiliate tracking error (non-fatal):', e) }
    }

    // Send registration email
    if (customerEmail) {
      await sendRegistrationEmail(sb, eventId, customerEmail, customerName, amountPaid, currency)
    }

    return { action: 'registered_via_metadata', event_id: eventId }
  }

  // --- FALLBACK: Match by payment_link ID (legacy payment link flow) ---
  const paymentLink = session.payment_link
  if (!paymentLink) {
    return { action: 'no_event_id_or_payment_link' }
  }

  const { data: tickets } = await sb
    .from('event_tickets')
    .select('id, sold_count, capacity, event_id')
    .like('stripe_payment_link', `%${paymentLink}%`)

  if (tickets && tickets.length > 0) {
    const ticket = tickets[0]
    const newCount = (ticket.sold_count || 0) + 1
    await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', ticket.id)

    if (newCount >= ticket.capacity) {
      await sb.from('events').update({ status: 'sold_out' }).eq('id', ticket.event_id)
      await sb.from('event_tickets').update({ status: 'sold_out' }).eq('id', ticket.id)
    }

    if (customerEmail) {
      await sendRegistrationEmail(sb, ticket.event_id, customerEmail, customerName, amountPaid, currency)
    }

    return { action: 'registered_via_payment_link', event_id: ticket.event_id }
  }

  // Last fallback: match via events table
  const { data: events } = await sb
    .from('events')
    .select('id')
    .like('stripe_payment_link', `%${paymentLink}%`)

  if (events && events.length > 0) {
    const fallbackEventId = events[0].id
    const { data: eventTickets } = await sb
      .from('event_tickets')
      .select('id, sold_count, capacity')
      .eq('event_id', fallbackEventId)

    if (eventTickets && eventTickets.length > 0) {
      const ticket = eventTickets[0]
      const newCount = (ticket.sold_count || 0) + 1
      await sb.from('event_tickets').update({ sold_count: newCount }).eq('id', ticket.id)

      if (newCount >= ticket.capacity) {
        await sb.from('events').update({ status: 'sold_out' }).eq('id', fallbackEventId)
      }

      if (customerEmail) {
        await sendRegistrationEmail(sb, fallbackEventId, customerEmail, customerName, amountPaid, currency)
      }

      return { action: 'registered_via_event_fallback', event_id: fallbackEventId }
    }
  }

  return { action: 'no_matching_event' }
}

export async function POST(req: NextRequest) {
  try {
    let event: Stripe.Event | null = null

    // Verify webhook signature if secret is configured
    if (webhookSecret && stripe) {
      const body = await req.text()
      const signature = req.headers.get('stripe-signature')

      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
      }

      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      // No signature verification (legacy mode — still works but less secure)
      const body = await req.json()
      event = body as unknown as Stripe.Event
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const result = await handleCheckoutCompleted(session)
      return NextResponse.json({ received: true, ...result })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
