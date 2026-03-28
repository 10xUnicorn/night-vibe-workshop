import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  getWaitlistUpcomingEventsEmail,
  getWaitlistCustomEmail,
} from '@/lib/emailTemplates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function checkAuth(password: string) {
  return password === (process.env.ADMIN_PASSWORD || 'nightvibe2026')
}

// POST: Send emails to selected waitlist members
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, template, recipients, eventIds, customSubject, customBody } = body

    if (!checkAuth(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients selected' }, { status: 400 })
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey)
    const results: { email: string; success: boolean; error?: string }[] = []

    if (template === 'upcoming_events') {
      // Fetch event details for the selected events
      if (!eventIds || eventIds.length === 0) {
        return NextResponse.json({ error: 'No events selected for this template' }, { status: 400 })
      }

      const { data: eventsData } = await sb
        .from('events')
        .select('id, title, start_date, end_date, timezone, stripe_payment_link, event_tickets(price, capacity, sold_count)')
        .in('id', eventIds)
        .order('start_date')

      if (!eventsData || eventsData.length === 0) {
        return NextResponse.json({ error: 'No events found' }, { status: 400 })
      }

      const eventsList = eventsData.map((ev: any) => {
        const ticket = ev.event_tickets?.[0]
        return {
          title: ev.title,
          startDate: ev.start_date,
          endDate: ev.end_date,
          timezone: ev.timezone,
          price: ticket?.price || 997,
          seatsAvailable: (ticket?.capacity || 20) - (ticket?.sold_count || 0),
          registrationUrl: ev.stripe_payment_link || `https://workshop.nightvibe.me/events/${ev.id}`,
        }
      })

      for (const recipient of recipients) {
        try {
          const { subject, html } = getWaitlistUpcomingEventsEmail({
            name: recipient.name || 'there',
            events: eventsList,
          })

          const result = await sendEmail({ to: recipient.email, subject, html })

          // Log to sent_emails
          await sb.from('sent_emails').insert({
            email_type: 'waitlist_upcoming_events',
            recipient_email: recipient.email,
            event_id: eventIds[0],
            subject,
            html_body: html,
            metadata: { recipientName: recipient.name, template, eventIds },
            status: result.success ? 'sent' : 'failed',
            resend_message_id: result.data?.id || null,
          } as any)

          results.push({ email: recipient.email, success: result.success, error: result.success ? undefined : 'Send failed' })
        } catch (err) {
          results.push({ email: recipient.email, success: false, error: String(err) })
        }
      }
    } else if (template === 'custom') {
      if (!customSubject || !customBody) {
        return NextResponse.json({ error: 'Custom emails require subject and body' }, { status: 400 })
      }

      for (const recipient of recipients) {
        try {
          const { subject, html } = getWaitlistCustomEmail({
            name: recipient.name || 'there',
            subject: customSubject,
            body: customBody,
          })

          const result = await sendEmail({ to: recipient.email, subject, html })

          await sb.from('sent_emails').insert({
            email_type: 'waitlist_custom',
            recipient_email: recipient.email,
            event_id: null,
            subject,
            html_body: html,
            metadata: { recipientName: recipient.name, template },
            status: result.success ? 'sent' : 'failed',
            resend_message_id: result.data?.id || null,
          } as any)

          results.push({ email: recipient.email, success: result.success, error: result.success ? undefined : 'Send failed' })
        } catch (err) {
          results.push({ email: recipient.email, success: false, error: String(err) })
        }
      }
    } else {
      return NextResponse.json({ error: 'Unknown template' }, { status: 400 })
    }

    const sent = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({ success: true, sent, failed, results })
  } catch (err) {
    console.error('Waitlist email error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH: Update reply notes on a sent email
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { password, emailId, replyNotes, replied } = body

    if (!checkAuth(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey)

    const updateData: any = {}
    if (replyNotes !== undefined) updateData.reply_notes = replyNotes
    if (replied) updateData.replied_at = new Date().toISOString()

    const { error } = await sb
      .from('sent_emails')
      .update(updateData)
      .eq('id', emailId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Reply notes error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
