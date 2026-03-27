import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  getRegistrationConfirmationEmail,
  getWaitlistConfirmationEmail,
  getPreEventReminderEmail,
  getPreEventReminderOneDayEmail,
  getPreEventReminderOneHourEmail,
  getPreEventReminderFiveMinEmail,
  getNewEventNotificationEmail,
} from '@/lib/emailTemplates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function checkAuth(password: string) {
  return password === (process.env.ADMIN_PASSWORD || 'nightvibe2026')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, to, data, password } = body

    if (!checkAuth(password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing type or to' }, { status: 400 })
    }

    let subject = ''
    let html = ''

    switch (type) {
      case 'registration_confirmation':
        subject = `You're In! ${data.eventTitle} — Registration Confirmed`
        html = getRegistrationConfirmationEmail(data)
        break
      case 'waitlist_confirmation':
        subject = `You're on the Waitlist${data.eventTitle ? ` for ${data.eventTitle}` : ''}`
        html = getWaitlistConfirmationEmail(data)
        break
      case 'pre_event_3day':
        subject = `${data.eventTitle} starts in 3 days!`
        html = getPreEventReminderEmail(data)
        break
      case 'pre_event_1day':
        subject = `Tomorrow: ${data.eventTitle}`
        html = getPreEventReminderOneDayEmail(data)
        break
      case 'pre_event_1hour':
        subject = `Starting in 1 hour: ${data.eventTitle}`
        html = getPreEventReminderOneHourEmail(data)
        break
      case 'pre_event_5min':
        subject = `We're starting NOW: ${data.eventTitle}`
        html = getPreEventReminderFiveMinEmail(data)
        break
      case 'new_event_notification':
        subject = `New Workshop: ${data.eventTitle} — You Get Early Access`
        html = getNewEventNotificationEmail(data)
        break
      default:
        return NextResponse.json({ error: 'Unknown email type' }, { status: 400 })
    }

    const result = await sendEmail({ to, subject, html })

    // Log to sent_emails table
    try {
      const sb = createClient(supabaseUrl, supabaseServiceKey)
      await sb.from('sent_emails').insert({
        email_type: type,
        recipient_email: to,
        event_id: data.eventId || data.event_id || null,
        subject,
        metadata: data,
        status: result.success ? 'sent' : 'failed',
      } as any)
    } catch (logErr) {
      console.error('Failed to log email:', logErr)
    }

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.data?.id })
    } else {
      return NextResponse.json({ error: 'Failed to send', details: result.error }, { status: 500 })
    }
  } catch (err) {
    console.error('Email API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
