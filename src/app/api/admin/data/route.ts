import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function checkAuth(password: string) {
  const adminPw = process.env.ADMIN_PASSWORD
  if (!adminPw) return false
  return password === adminPw
}

// GET admin data — events, waitlist, registrations, hosts — using service_role to bypass RLS
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch all events (including drafts) with tickets
  const { data: events } = await sb
    .from('events')
    .select('*, event_tickets(*)')
    .order('start_date', { ascending: false })

  // Fetch all waitlist signups
  const { data: waitlist } = await sb
    .from('waitlist_signups')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all registrations
  const { data: registrations } = await sb
    .from('event_registrations')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch all hosts
  const { data: hosts } = await sb
    .from('hosts')
    .select('*')
    .order('name')

  // Fetch event-host links
  const { data: eventHosts } = await sb
    .from('event_hosts')
    .select('*')
    .order('display_order')

  // Fetch offer items
  const { data: offerItems } = await sb
    .from('offer_items')
    .select('*')
    .order('display_order')

  // Fetch event-offer links
  const { data: eventOfferItems } = await sb
    .from('event_offer_items')
    .select('*')
    .order('display_order')

  // Fetch guarantees
  const { data: guarantees } = await sb
    .from('guarantees')
    .select('*')
    .order('created_at')

  // Fetch event-guarantee links
  const { data: eventGuarantees } = await sb
    .from('event_guarantees')
    .select('*')
    .order('display_order')

  // Fetch contact submissions
  const { data: contactSubmissions } = await sb
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch social proof entries
  const { data: socialProofEntries } = await sb
    .from('social_proof_entries')
    .select('*')
    .order('display_order')

  // Fetch sent emails
  const { data: sentEmails } = await sb
    .from('sent_emails')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Fetch app questionnaires
  const { data: appQuestionnaires } = await sb
    .from('app_questionnaires')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({
    events: events || [],
    waitlist: waitlist || [],
    registrations: registrations || [],
    hosts: hosts || [],
    eventHosts: eventHosts || [],
    offerItems: offerItems || [],
    eventOfferItems: eventOfferItems || [],
    guarantees: guarantees || [],
    eventGuarantees: eventGuarantees || [],
    contactSubmissions: contactSubmissions || [],
    socialProofEntries: socialProofEntries || [],
    sentEmails: sentEmails || [],
    appQuestionnaires: appQuestionnaires || [],
  })
}
