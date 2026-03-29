import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function checkAuth(password: string) {
  const adminPw = process.env.ADMIN_PASSWORD
  if (!adminPw) return false
  return password === adminPw
}

// GET all guarantees (public)
export async function GET() {
  const sb = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await sb.from('guarantees').select('*').eq('is_active', true).order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ guarantees: data })
}

// CREATE guarantee or link/unlink to event
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()

  // Link guarantee to event
  if (body.action === 'link_event') {
    const { error } = await sb.from('event_guarantees').upsert({
      event_id: body.event_id,
      guarantee_id: body.guarantee_id,
      display_order: body.display_order || 0,
    }, { onConflict: 'event_id,guarantee_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Unlink guarantee from event
  if (body.action === 'unlink_event') {
    const { error } = await sb.from('event_guarantees').delete()
      .eq('event_id', body.event_id)
      .eq('guarantee_id', body.guarantee_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Create new guarantee
  const { data, error } = await sb.from('guarantees').insert({
    title: body.title,
    description: body.description || '',
    icon: body.icon || '🛡️',
    badge_text: body.badge_text || '100% Money-Back Guarantee',
    fine_print: body.fine_print || '',
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, guarantee: data })
}

// UPDATE guarantee
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const updates: Record<string, unknown> = {}
  const fields = ['title', 'description', 'icon', 'badge_text', 'fine_print', 'is_active']
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  const { error } = await sb.from('guarantees').update(updates).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE guarantee
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { error } = await sb.from('guarantees').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
