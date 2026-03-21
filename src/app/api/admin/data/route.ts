import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function checkAuth(password: string) {
  return password === (process.env.ADMIN_PASSWORD || 'nightvibe2026')
}

// GET admin data — events, waitlist, registrations — using service_role to bypass RLS
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

  return NextResponse.json({
    events: events || [],
    waitlist: waitlist || [],
    registrations: registrations || [],
  })
}
