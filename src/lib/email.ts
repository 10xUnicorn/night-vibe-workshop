import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const client = getResend()
  if (!client) {
    console.warn('RESEND_API_KEY not set — skipping email send to:', to)
    return { success: false, error: 'No API key' }
  }
  try {
    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || 'Night Vibe <hello@nightvibe.ai>',
      to,
      subject,
      html,
    })
    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }
    console.log('Email sent:', data?.id, 'to:', to)
    return { success: true, data }
  } catch (err) {
    console.error('Email exception:', err)
    return { success: false, error: err }
  }
}
