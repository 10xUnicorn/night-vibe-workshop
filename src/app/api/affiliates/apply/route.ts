import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function generateSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}

// POST - Submit affiliate application (public, no auth required)
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Validate required fields
  if (!body.first_name?.trim() || !body.last_name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 })
  }

  const sb = getAdmin()
  const emailLower = body.email.trim().toLowerCase()

  // Check for duplicate email
  const { data: existingAffiliate, error: checkError } = await sb
    .from('affiliates')
    .select('id')
    .eq('email', emailLower)
    .single()

  if (existingAffiliate) {
    return NextResponse.json({ error: 'An application with this email already exists' }, { status: 400 })
  }

  // Generate slug from name
  const slug = generateSlug(body.first_name.trim(), body.last_name.trim())

  // Create affiliate with pending status and default 15% commission
  const { data: affiliate, error } = await sb.from('affiliates').insert({
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    email: emailLower,
    phone: body.phone?.trim() || null,
    company: body.company?.trim() || null,
    website_url: body.website_url?.trim() || null,
    partnership_reason: body.partnership_reason?.trim() || null,
    commission_rate: 15,
    custom_slug: slug,
    status: 'pending',
    notes: null,
    bio: null,
  }).select().single()

  if (error) {
    console.error('Error creating affiliate:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send confirmation email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://workshop.nightvibe.me'
  const portalLink = `${siteUrl}/partners`

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f0f; color: #e0e0e0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; padding: 40px 20px; border-radius: 8px; }
    .header { color: #a78bfa; font-size: 24px; margin-bottom: 30px; font-weight: bold; }
    .title { color: #14b8a6; font-size: 20px; margin: 20px 0; }
    .button { display: inline-block; background: #a78bfa; color: #0f0f0f; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .footer { color: #808080; font-size: 12px; margin-top: 30px; border-top: 1px solid #333; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">✨ Night Vibe</div>
    <div class="title">Application Received</div>
    <p>Thank you for applying to the Night Vibe Partner Program! We've received your application and our team is reviewing it.</p>

    <p>You can expect to hear back from us within 24-48 hours. Once approved, you'll have access to your partner dashboard where you can:</p>
    <ul>
      <li>Generate custom tracking links</li>
      <li>Track clicks and conversions</li>
      <li>Monitor your commissions</li>
      <li>Access marketing materials</li>
    </ul>

    <a href="${portalLink}" class="button">View Partner Portal</a>

    <p>In the meantime, you can bookmark your portal link. Once your application is approved, you'll be able to log in with your email.</p>

    <div class="footer">
      <p>Questions? Contact us at partners@nightvibe.me</p>
      <p>© Night Vibe. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

  await sendEmail({
    to: emailLower,
    subject: 'Application Received — Night Vibe Partner Program',
    html: emailHtml,
  }).catch(err => {
    console.error('Failed to send confirmation email:', err)
  })

  return NextResponse.json(affiliate, { status: 201 })
}
