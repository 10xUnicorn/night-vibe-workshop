import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (!body.email || !body.name || !body.message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 })
  }

  const sb = createClient(supabaseUrl, supabaseServiceKey)

  const { error } = await sb.from('contact_submissions').insert({
    name: body.name,
    email: body.email,
    message: body.message,
    event_id: body.event_id || null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
