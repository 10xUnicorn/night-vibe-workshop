import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Nurture email sequence — sent from nightvibe.me
const NURTURE_SEQUENCE = [
  {
    delay_hours: 0, // Immediate
    subject: '🚀 Your AI App Blueprint Request — Here\'s What\'s Next',
    template: 'welcome',
  },
  {
    delay_hours: 12, // 12 hours later
    subject: 'The $100K app idea hiding in your daily tasks',
    template: 'value_1',
  },
  {
    delay_hours: 36, // Day 2
    subject: 'How {{name}} could save 20+ hours/week with one app',
    template: 'value_2',
  },
  {
    delay_hours: 60, // Day 3
    subject: '⚡ 3 apps built in 2 days — real results from real entrepreneurs',
    template: 'social_proof',
  },
  {
    delay_hours: 84, // Day 4
    subject: 'Your seat is being held — but not for long',
    template: 'urgency',
  },
  {
    delay_hours: 108, // Day 5 (Saturday before Monday workshop)
    subject: '🔴 Final call: Workshop starts Monday — {{seats}} seats left',
    template: 'final_call',
  },
]

function generateEmailHtml(template: string, data: {
  name: string
  email: string
  businessType: string
  biggestProblem: string
  workshopUrl: string
  workshopDate: string
  seatsLeft: number
  unsubscribeUrl: string
}): string {
  const { name, businessType, biggestProblem, workshopUrl, workshopDate, seatsLeft, unsubscribeUrl } = data
  const firstName = name.split(' ')[0]

  const wrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 20px;">
  <!-- Logo/Header -->
  <div style="text-align:center;margin-bottom:32px;">
    <span style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Night Vibe</span>
    <span style="display:block;font-size:11px;color:#8B5CF6;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">AI App Development</span>
  </div>

  ${content}

  <!-- Footer -->
  <div style="margin-top:48px;padding-top:24px;border-top:1px solid rgba(108,58,237,0.15);text-align:center;">
    <p style="font-size:12px;color:#6B6B85;line-height:1.6;">
      Night Vibe — AI App Development Company<br>
      You're receiving this because you requested an AI App Blueprint.<br>
      <a href="${unsubscribeUrl}" style="color:#8B5CF6;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</div>
</body>
</html>`

  const ctaButton = (text: string, url: string) => `
<div style="text-align:center;margin:32px 0;">
  <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#6c3aed,#8b5cf6);color:#fff;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;font-size:16px;letter-spacing:0.3px;">
    ${text}
  </a>
</div>`

  const templates: Record<string, string> = {
    welcome: wrapper(`
  <h1 style="font-size:28px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:16px;">
    Hey ${firstName} — your blueprint request is in 🎯
  </h1>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    You told us your biggest challenge is: <strong style="color:#2DD4BF;">"${biggestProblem}"</strong>
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    That's exactly the kind of problem that turns into a powerful AI app — one that saves you hours every week or opens up a brand new revenue stream.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    In our upcoming <strong style="color:#fff;">2-Day AI App Workshop</strong>, you'll build a real, working app that solves problems just like this — live, with a guide, in just 8 hours total.
  </p>
  <div style="background:rgba(108,58,237,0.08);border:1px solid rgba(108,58,237,0.2);border-radius:12px;padding:24px;margin:24px 0;">
    <p style="font-size:14px;color:#8B5CF6;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Workshop Details</p>
    <p style="font-size:15px;color:#B0B0C5;line-height:1.7;margin:0;">
      📅 ${workshopDate}<br>
      🕐 9 AM – 1 PM PT each day<br>
      💻 Live & Virtual — 20 seats max<br>
      🎯 You'll walk out with a deployed, working app
    </p>
  </div>
  ${ctaButton('Reserve Your Seat →', workshopUrl)}
  <p style="font-size:14px;color:#6B6B85;text-align:center;">Only ${seatsLeft} of 20 seats remaining</p>
`),

    value_1: wrapper(`
  <h1 style="font-size:26px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:16px;">
    The $100K app idea hiding in your daily tasks
  </h1>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    ${firstName}, you mentioned your business type is <strong style="color:#fff;">${businessType}</strong>.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    Here's what we've seen from entrepreneurs in similar spaces: the tasks you repeat every week — the ones that feel too small to fix — are usually worth <strong style="color:#2DD4BF;">$50K-$200K/year</strong> when you turn them into an automated system or a tool you can sell.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    Real examples from past workshop attendees:
  </p>
  <div style="margin:24px 0;">
    <div style="background:rgba(45,212,191,0.06);border-left:3px solid #2DD4BF;padding:16px 20px;margin-bottom:12px;border-radius:0 8px 8px 0;">
      <p style="font-size:15px;color:#fff;margin:0;font-weight:600;">Client onboarding tool → saved 15 hrs/week</p>
      <p style="font-size:13px;color:#6B6B85;margin:4px 0 0;">Built in the workshop, deployed same day</p>
    </div>
    <div style="background:rgba(45,212,191,0.06);border-left:3px solid #8B5CF6;padding:16px 20px;margin-bottom:12px;border-radius:0 8px 8px 0;">
      <p style="font-size:15px;color:#fff;margin:0;font-weight:600;">Lead qualification app → $8K/mo in new revenue</p>
      <p style="font-size:13px;color:#6B6B85;margin:4px 0 0;">Took 6 hours to build, launched at $49/mo</p>
    </div>
    <div style="background:rgba(45,212,191,0.06);border-left:3px solid #2DD4BF;padding:16px 20px;border-radius:0 8px 8px 0;">
      <p style="font-size:15px;color:#fff;margin:0;font-weight:600;">Internal reporting dashboard → replaced $500/mo in SaaS tools</p>
      <p style="font-size:13px;color:#6B6B85;margin:4px 0 0;">Custom-built for their exact workflow</p>
    </div>
  </div>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:8px;">
    Your problem — <em>"${biggestProblem}"</em> — has the same kind of potential.
  </p>
  ${ctaButton('Build Your App This Week →', workshopUrl)}
`),

    value_2: wrapper(`
  <h1 style="font-size:26px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:16px;">
    How you could save 20+ hours/week with one app
  </h1>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    ${firstName}, let me paint a quick picture:
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    Right now, that manual task you described — <strong style="color:#2DD4BF;">"${biggestProblem}"</strong> — probably eats up hours every week. Maybe more.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    Now imagine opening your laptop on Monday morning and seeing it <strong style="color:#fff;">already done</strong>. Automatically. Because the app you built handles it.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    That's not hypothetical. In our workshop, you'll use Claude AI + modern dev tools to build exactly that. No coding background needed.
  </p>
  <div style="background:rgba(108,58,237,0.08);border:1px solid rgba(108,58,237,0.2);border-radius:12px;padding:24px;margin:24px 0;">
    <p style="font-size:16px;color:#fff;font-weight:700;margin-bottom:12px;">Here's what you'll walk out with:</p>
    <p style="font-size:15px;color:#B0B0C5;line-height:2;margin:0;">
      ✅ A real, deployed app — live on the internet<br>
      ✅ Full code ownership — yours forever<br>
      ✅ The skills to build your next app solo<br>
      ✅ Access to recordings + community<br>
      ✅ 3 bonus future workshop sessions
    </p>
  </div>
  ${ctaButton('Secure Your Spot — ' + seatsLeft + ' Left →', workshopUrl)}
`),

    social_proof: wrapper(`
  <h1 style="font-size:26px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:16px;">
    3 apps. 2 days. Real businesses. Real results.
  </h1>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:24px;">
    ${firstName}, I know "build an app in 2 days" sounds aggressive. So let me show you what's actually possible:
  </p>
  <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:24px;margin-bottom:16px;">
    <p style="font-size:18px;color:#10B981;font-weight:700;margin-bottom:8px;">💬 "I built my entire client portal in Day 1"</p>
    <p style="font-size:14px;color:#B0B0C5;line-height:1.6;margin:0;">
      "I came in thinking I'd learn some basics. By lunch on Day 1, I had a working client portal with login, file uploads, and a dashboard. By Day 2, I added payment processing. It replaced 3 SaaS tools I was paying $400/month for."
    </p>
  </div>
  <div style="background:rgba(108,58,237,0.06);border:1px solid rgba(108,58,237,0.2);border-radius:12px;padding:24px;margin-bottom:16px;">
    <p style="font-size:18px;color:#8B5CF6;font-weight:700;margin-bottom:8px;">💬 "My app is already generating revenue"</p>
    <p style="font-size:14px;color:#B0B0C5;line-height:1.6;margin:0;">
      "I turned my consulting framework into an interactive tool. Launched it at $49/month. Got 12 subscribers in the first week. The workshop paid for itself before it was even over."
    </p>
  </div>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin:24px 0 8px;">
    Your idea — solving <em>"${biggestProblem}"</strong> — has the same potential. You just need 8 hours and the right guidance.
  </p>
  ${ctaButton('Join Them — Reserve Your Seat →', workshopUrl)}
  <p style="font-size:14px;color:#EF4444;text-align:center;font-weight:600;">⚡ Only ${seatsLeft} seats remain — workshop is ${workshopDate}</p>
`),

    urgency: wrapper(`
  <h1 style="font-size:26px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:16px;">
    Your seat is being held — but not for long
  </h1>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    ${firstName}, you requested an App Blueprint a few days ago because you recognized something important: <strong style="color:#fff;">AI can transform your business</strong>.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    The gap between knowing that and doing something about it? That's where most people get stuck.
  </p>
  <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
    <p style="font-size:36px;font-weight:900;color:#EF4444;margin:0 0 8px;">${seatsLeft}</p>
    <p style="font-size:14px;color:#EF4444;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0;">seats remaining of 20</p>
    <p style="font-size:13px;color:#6B6B85;margin:8px 0 0;">Workshop: ${workshopDate}</p>
  </div>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    This workshop is capped at 20 people so everyone gets personal attention. Once it's full, the next session won't be for weeks.
  </p>
  <p style="font-size:16px;color:#fff;line-height:1.7;font-weight:600;margin-bottom:8px;">
    Two days from now, you could have a working app that solves "${biggestProblem}" — deployed and live.
  </p>
  ${ctaButton('Reserve My Seat Now →', workshopUrl)}
`),

    final_call: wrapper(`
  <div style="background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.3);border-radius:16px;padding:32px;margin-bottom:24px;text-align:center;">
    <p style="font-size:12px;color:#EF4444;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">🔴 FINAL NOTICE</p>
    <h1 style="font-size:28px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:8px;">
      Workshop starts Monday
    </h1>
    <p style="font-size:18px;color:#EF4444;font-weight:700;">${seatsLeft} seats left</p>
  </div>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    ${firstName} — this is it.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    The workshop starts <strong style="color:#fff;">${workshopDate}</strong>. After that, these seats are gone and the next session is weeks away.
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;margin-bottom:16px;">
    In 48 hours you could have:
  </p>
  <p style="font-size:16px;color:#B0B0C5;line-height:2;margin-bottom:16px;">
    → A working app that solves "${biggestProblem}"<br>
    → Full code ownership<br>
    → Skills to build your next 10 apps<br>
    → A community of builders behind you
  </p>
  <p style="font-size:16px;color:#fff;font-weight:700;line-height:1.7;margin-bottom:8px;">
    Or you could be in the same spot next week, still thinking about it.
  </p>
  ${ctaButton('I\'m In — Reserve My Seat →', workshopUrl)}
  <p style="font-size:13px;color:#6B6B85;text-align:center;margin-top:8px;">
    Secure checkout via Stripe · Instant confirmation · Recording included
  </p>
`)
  }

  return templates[template] || templates.welcome
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, business_type, biggest_problem, ref_code } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    // Check for existing submission
    const { data: existing } = await supabase
      .from('blueprint_leads')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already submitted', duplicate: true })
    }

    // Get current event for dynamic content
    const { data: event } = await supabase
      .from('events')
      .select('*, event_tickets(*)')
      .eq('is_featured', true)
      .in('status', ['published', 'sold_out'])
      .order('start_date', { ascending: true })
      .limit(1)
      .single()

    const ticket = event?.event_tickets?.[0]
    const seatsLeft = ticket ? Math.max(0, ticket.capacity - ticket.sold_count) : 16
    const workshopDate = event
      ? `${new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
      : 'April 7-8, 2026'
    const workshopUrl = event?.stripe_payment_link || 'https://workshop.nightvibe.me'

    // Calculate nurture schedule
    const now = new Date()
    const nextEmailAt = new Date(now.getTime() + NURTURE_SEQUENCE[1].delay_hours * 60 * 60 * 1000)

    // Save to Night Vibe Supabase
    const { data: lead, error } = await supabase
      .from('blueprint_leads')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        business_type: business_type?.trim() || null,
        biggest_problem: biggest_problem?.trim() || null,
        ref_code: ref_code || null,
        nurture_status: 'active',
        nurture_step: 1,
        last_email_sent_at: now.toISOString(),
        next_email_at: nextEmailAt.toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Blueprint lead insert error:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    // Send immediate welcome email
    const unsubscribeUrl = `https://workshop.nightvibe.me/api/blueprint/unsubscribe?email=${encodeURIComponent(email.toLowerCase().trim())}`

    const emailHtml = generateEmailHtml('welcome', {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      businessType: business_type?.trim() || 'your business',
      biggestProblem: biggest_problem?.trim() || 'your biggest challenge',
      workshopUrl,
      workshopDate,
      seatsLeft,
      unsubscribeUrl,
    })

    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: NURTURE_SEQUENCE[0].subject,
      html: emailHtml,
    })

    return NextResponse.json({ success: true, lead_id: lead.id })
  } catch (err) {
    console.error('Blueprint API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET — used by cron/scheduled task to send nurture emails
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Fetch leads that need their next email
  const { data: leads, error } = await supabase
    .from('blueprint_leads')
    .select('*')
    .eq('nurture_status', 'active')
    .lte('next_email_at', now.toISOString())
    .order('next_email_at', { ascending: true })
    .limit(50)

  if (error || !leads?.length) {
    return NextResponse.json({ sent: 0, message: error?.message || 'No leads to process' })
  }

  // Get event data for dynamic content
  const { data: event } = await supabase
    .from('events')
    .select('*, event_tickets(*)')
    .eq('is_featured', true)
    .in('status', ['published', 'sold_out'])
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  const ticket = event?.event_tickets?.[0]
  const seatsLeft = ticket ? Math.max(0, ticket.capacity - ticket.sold_count) : 16
  const workshopDate = event
    ? `${new Date(event.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}-${new Date(event.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
    : 'April 7-8, 2026'
  const workshopUrl = event?.stripe_payment_link || 'https://workshop.nightvibe.me'

  let sentCount = 0

  for (const lead of leads) {
    const stepIndex = lead.nurture_step
    if (stepIndex >= NURTURE_SEQUENCE.length) {
      // Completed all emails
      await supabase
        .from('blueprint_leads')
        .update({ nurture_status: 'converted', updated_at: now.toISOString() })
        .eq('id', lead.id)
      continue
    }

    const step = NURTURE_SEQUENCE[stepIndex]
    const unsubscribeUrl = `https://workshop.nightvibe.me/api/blueprint/unsubscribe?email=${encodeURIComponent(lead.email)}`

    const emailHtml = generateEmailHtml(step.template, {
      name: lead.name,
      email: lead.email,
      businessType: lead.business_type || 'your business',
      biggestProblem: lead.biggest_problem || 'your biggest challenge',
      workshopUrl,
      workshopDate,
      seatsLeft,
      unsubscribeUrl,
    })

    const subject = step.subject
      .replace('{{name}}', lead.name.split(' ')[0])
      .replace('{{seats}}', String(seatsLeft))

    const result = await sendEmail({
      to: lead.email,
      subject,
      html: emailHtml,
    })

    if (result.success) {
      const nextStep = stepIndex + 1
      const nextDelay = nextStep < NURTURE_SEQUENCE.length
        ? NURTURE_SEQUENCE[nextStep].delay_hours
        : null

      await supabase
        .from('blueprint_leads')
        .update({
          nurture_step: nextStep,
          last_email_sent_at: now.toISOString(),
          next_email_at: nextDelay
            ? new Date(lead.created_at).getTime() + nextDelay * 60 * 60 * 1000 > now.getTime()
              ? new Date(new Date(lead.created_at).getTime() + nextDelay * 60 * 60 * 1000).toISOString()
              : new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString() // min 4hr gap
            : null,
          nurture_status: nextStep >= NURTURE_SEQUENCE.length ? 'converted' : 'active',
          updated_at: now.toISOString(),
        })
        .eq('id', lead.id)

      sentCount++
    }
  }

  return NextResponse.json({ sent: sentCount, total: leads.length })
}
