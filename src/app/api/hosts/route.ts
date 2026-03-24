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

// GET all hosts (public)
export async function GET() {
  const sb = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data, error } = await sb.from('hosts').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hosts: data })
}

// CREATE host
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { data, error } = await sb.from('hosts').insert({
    name: body.name,
    title: body.title || null,
    company: body.company || null,
    short_description: body.short_description || null,
    bio: body.bio || null,
    headshot_url: body.headshot_url || null,
    promo_graphic_url: body.promo_graphic_url || null,
    category: body.category || 'speaker',
    is_featured: body.is_featured || false,
    social_links: body.social_links || {},
    stat1_value: body.stat1_value || null,
    stat1_label: body.stat1_label || null,
    stat2_value: body.stat2_value || null,
    stat2_label: body.stat2_label || null,
    stat3_value: body.stat3_value || null,
    stat3_label: body.stat3_label || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, host: data })
}

// UPDATE host
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()

  // Update host profile
  if (body.host_id) {
    const updates: Record<string, unknown> = {}
    const fields = ['name', 'title', 'company', 'short_description', 'bio', 'headshot_url', 'promo_graphic_url', 'category', 'is_featured', 'social_links', 'stat1_value', 'stat1_label', 'stat2_value', 'stat2_label', 'stat3_value', 'stat3_label']
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f]
    }
    updates.updated_at = new Date().toISOString()

    const { error } = await sb.from('hosts').update(updates).eq('id', body.host_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Link/unlink host to event
  if (body.action === 'link_event') {
    const { error } = await sb.from('event_hosts').upsert({
      event_id: body.event_id,
      host_id: body.host_id_link,
      role: body.role || 'speaker',
      display_order: body.display_order || 0,
    }, { onConflict: 'event_id,host_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (body.action === 'unlink_event') {
    const { error } = await sb.from('event_hosts').delete().eq('event_id', body.event_id).eq('host_id', body.host_id_unlink)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Missing host_id or action' }, { status: 400 })
}

// DELETE host
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { error } = await sb.from('hosts').delete().eq('id', body.host_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
