import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { getWaitlistConfirmationEmail } from '@/lib/emailTemplates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.email || !body.name) {
    return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
  }

  const sb = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await sb.from('waitlist_signups').insert({
    event_id: body.event_id || null,
    name: body.name,
    email: body.email,
    company: body.company || null,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ message: 'Already on waitlist' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send waitlist confirmation email (non-blocking)
  try {
    let eventTitle: string | undefined
    let startDate: string | undefined

    if (body.event_id) {
      const { data: event } = await sb
        .from('events')
        .select('title, start_date')
        .eq('id', body.event_id)
        .single()
      if (event) {
        eventTitle = event.title
        startDate = event.start_date
      }
    }

    const html = getWaitlistConfirmationEmail({
      name: body.name,
      eventTitle,
      startDate,
    })

    const result = await sendEmail({
      to: body.email,
      subject: `You're on the Waitlist${eventTitle ? ` for ${eventTitle}` : ''}`,
      html,
    })

    // Log email
    try {
      await sb.from('sent_emails').insert({
        email_type: 'waitlist_confirmation',
        recipient_email: body.email,
        event_id: body.event_id || null,
        subject: `You're on the Waitlist${eventTitle ? ` for ${eventTitle}` : ''}`,
        metadata: { name: body.name, eventTitle },
        status: result.success ? 'sent' : 'failed',
      })
    } catch (e) { console.error('Email log error:', e) }
  } catch (emailErr) {
    console.error('Waitlist email error (non-fatal):', emailErr)
  }

  return NextResponse.json({ success: true })
}
