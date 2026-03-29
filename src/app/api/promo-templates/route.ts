import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() { return createClient(supabaseUrl, supabaseServiceKey) }
function checkAuth(p: string) { return p === (process.env.ADMIN_PASSWORD || 'nightvibe2026') }

// GET — public (by event) or admin (all)
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  const password = req.nextUrl.searchParams.get('password') || ''

  const sb = getAdmin()

  if (eventId) {
    // Public access for affiliates — only active templates
    const { data, error } = await sb
      .from('promo_templates')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('sort_order')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  }

  if (!checkAuth(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await sb.from('promo_templates').select('*, events(title)').order('sort_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { data, error } = await sb.from('promo_templates').insert({
    event_id: body.event_id,
    type: body.type,
    name: body.name,
    subject_line: body.subject_line || null,
    preview_text: body.preview_text || null,
    body_content: body.body_content,
    body_html: body.body_html || null,
    platform: body.platform || null,
    sort_order: body.sort_order || 0,
    is_active: body.is_active ?? true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const updates: Record<string, unknown> = {}
  const fields = ['event_id', 'type', 'name', 'subject_line', 'preview_text', 'body_content', 'body_html', 'platform', 'sort_order', 'is_active']
  for (const f of fields) { if (body[f] !== undefined) updates[f] = body[f] }

  const { data, error } = await sb.from('promo_templates').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { error } = await sb.from('promo_templates').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
