import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function checkAuth(password: string) {
  return password === (process.env.ADMIN_PASSWORD || 'nightvibe2026')
}

// GET all offer items (public)
export async function GET() {
  const sb = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await sb.from('offer_items').select('*').order('display_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ offer_items: data })
}

// CREATE offer item
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()

  // Link offer item to event
  if (body.action === 'link_event') {
    const { error } = await sb.from('event_offer_items').upsert({
      event_id: body.event_id,
      offer_item_id: body.offer_item_id,
      display_order: body.display_order || 0,
    }, { onConflict: 'event_id,offer_item_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Unlink offer item from event
  if (body.action === 'unlink_event') {
    const { error } = await sb.from('event_offer_items').delete()
      .eq('event_id', body.event_id)
      .eq('offer_item_id', body.offer_item_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Create new offer item
  const { data, error } = await sb.from('offer_items').insert({
    icon: body.icon || '⭐',
    title: body.title,
    description: body.description || '',
    glow: body.glow || 'purple',
    is_bonus: body.is_bonus || false,
    display_order: body.display_order || 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, offer_item: data })
}

// UPDATE offer item
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const updates: Record<string, unknown> = {}
  const fields = ['icon', 'title', 'description', 'glow', 'is_bonus', 'display_order']
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  const { error } = await sb.from('offer_items').update(updates).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE offer item
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { error } = await sb.from('offer_items').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
