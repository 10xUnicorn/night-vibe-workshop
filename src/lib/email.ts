import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — skipping email send to:', to)
    return { success: false, error: 'No API key' }
  }
  try {
    const { data, error } = await resend.emails.send({
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
