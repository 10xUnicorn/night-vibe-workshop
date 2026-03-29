import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() { return createClient(supabaseUrl, supabaseServiceKey) }
function checkAuth(p: string) { return p === (process.env.ADMIN_PASSWORD || 'nightvibe2026') }

// GET campaigns
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password') || ''
  if (!checkAuth(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const folderId = req.nextUrl.searchParams.get('folder_id')
  const sb = getAdmin()

  let query = sb
    .from('campaigns')
    .select('*, campaign_folders(name), campaign_posts(count)')
    .order('updated_at', { ascending: false })

  if (folderId) query = query.eq('folder_id', folderId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// CREATE campaign
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()

  // If duplicating
  if (body.duplicate_id) {
    const { data: original } = await sb.from('campaigns').select('*').eq('id', body.duplicate_id).single()
    if (!original) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    const { data: campaign, error } = await sb.from('campaigns').insert({
      folder_id: body.folder_id || original.folder_id,
      event_id: original.event_id,
      name: body.name || `${original.name} (Copy)`,
      description: original.description,
      type: original.type,
      status: 'draft',
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Duplicate all posts
    const { data: posts } = await sb.from('campaign_posts').select('*').eq('campaign_id', body.duplicate_id).order('step_order')
    if (posts?.length) {
      const duped = posts.map(p => ({
        campaign_id: campaign.id,
        step_order: p.step_order,
        title: p.title,
        subject_line: p.subject_line,
        preview_text: p.preview_text,
        body_content: p.body_content,
        body_html: p.body_html,
        platform: p.platform,
        delay_days: p.delay_days,
        delay_hours: p.delay_hours,
        status: 'draft',
      }))
      await sb.from('campaign_posts').insert(duped)
    }

    return NextResponse.json(campaign, { status: 201 })
  }

  if (!body.name?.trim() || !body.type) {
    return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
  }

  const { data, error } = await sb.from('campaigns').insert({
    folder_id: body.folder_id || null,
    event_id: body.event_id || null,
    name: body.name.trim(),
    description: body.description || null,
    type: body.type,
    status: body.status || 'draft',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// UPDATE campaign
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const fields = ['folder_id', 'event_id', 'name', 'description', 'type', 'status']
  for (const f of fields) { if (body[f] !== undefined) updates[f] = body[f] }

  const { data, error } = await sb.from('campaigns').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE campaign
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { error } = await sb.from('campaigns').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
