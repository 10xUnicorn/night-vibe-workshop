import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  return NextResponse.json({ success: true })
}
