import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import {
  getQuestionnaireConfirmationEmail,
  getQuestionnaireNotificationEmail,
} from '@/lib/emailTemplates'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const NOTIFY_EMAILS = ['dknightunicorn@gmail.com', 'mark@marksavantmedia.com']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, app_idea, problem, target_customer, existing_business, biggest_challenge, technical_level, event_id, free_trial } = body

    if (!app_idea || !problem) {
      return NextResponse.json({ error: 'App idea and problem are required' }, { status: 400 })
    }

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey)

    // Save to database
    const { data, error } = await sb
      .from('app_questionnaires')
      .insert({
        event_id: event_id || null,
        name,
        email,
        app_idea,
        problem,
        target_customer: target_customer || null,
        existing_business: existing_business || null,
        biggest_challenge: biggest_challenge || null,
        technical_level: technical_level || null,
      } as any)
      .select()
      .single()

    if (error) throw error

    // Look up event title if event_id provided
    let eventTitle: string | undefined
    if (event_id) {
      const { data: evData } = await sb.from('events').select('title').eq('id', event_id).single()
      if (evData) eventTitle = evData.title
    }

    // Send confirmation email to submitter
    try {
      const confirmHtml = getQuestionnaireConfirmationEmail({
        name: name.split(' ')[0],
        appIdea: app_idea,
        eventTitle,
      })

      await sendEmail({
        to: email,
        subject: `We got your app idea, ${name.split(' ')[0]}!`,
        html: confirmHtml,
      })

      // Log it
      await sb.from('sent_emails').insert({
        email_type: 'questionnaire_confirmation',
        recipient_email: email,
        event_id: event_id || null,
        subject: `We got your app idea, ${name.split(' ')[0]}!`,
        metadata: { name, appIdea: app_idea },
        status: 'sent',
      } as any)
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr)
    }

    // Send BCC notification to Daniel and Mark
    try {
      const notifyHtml = getQuestionnaireNotificationEmail({
        submitterName: name,
        submitterEmail: email,
        appIdea: app_idea,
        problem,
        targetCustomer: target_customer,
        existingBusiness: existing_business,
        biggestChallenge: biggest_challenge,
        technicalLevel: technical_level,
        eventTitle,
      })

      for (const notifyEmail of NOTIFY_EMAILS) {
        await sendEmail({
          to: notifyEmail,
          subject: `New App Idea Submitted: ${name} — ${app_idea.slice(0, 60)}`,
          html: notifyHtml,
        })
      }
    } catch (notifyErr) {
      console.error('Failed to send notification emails:', notifyErr)
    }

    // Create free trial account in appdash if requested
    let magic_link: string | undefined
    if (free_trial) {
      try {
        const appdashUrl = process.env.APPDASH_EDGE_URL || 'https://emkorksloahggbymiiim.supabase.co/functions/v1/create-trial-user'
        const secret = process.env.TRIAL_INTERNAL_SECRET || 'nvw_trial_secret_xK9mP3qR'
        const trialRes = await fetch(appdashUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret },
          body: JSON.stringify({ name, email, app_idea, problem, target_customer, existing_business, biggest_challenge, technical_level }),
        })
        const trialData = await trialRes.json()
        if (trialData.magic_link) magic_link = trialData.magic_link
      } catch (trialErr) {
        console.error('Trial creation error:', trialErr)
      }
    }

    return NextResponse.json({ ...data, magic_link }, { status: 201 })
  } catch (err) {
    console.error('Questionnaire error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
