import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, review, stars } = body

    const sb = createClient(supabaseUrl, supabaseServiceKey)
    const { data: settings } = await sb.from('review_settings').select('notification_email').single()
    const notificationEmail = settings?.notification_email || 'dknightunicorn@gmail.com'

    // Use Resend if configured, otherwise log
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Night Vibe <notifications@nightvibe.me>',
          to: [notificationEmail],
          subject: `⭐ New ${stars}-Star Review from ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7c3aed;">New Workshop Review Submitted</h2>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Rating:</strong> ${'⭐'.repeat(stars)}</p>
                <hr style="border: none; border-top: 1px solid #d1d5db; margin: 12px 0;" />
                <p style="line-height: 1.6; color: #374151;">${review}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Log into your admin dashboard to approve and publish this review.
              </p>
              <a href="https://workshop.nightvibe.me/admin" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 12px;">
                View in Admin →
              </a>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 })
  }
}
