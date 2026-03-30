import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() { return createClient(supabaseUrl, supabaseServiceKey) }
function checkAuth(p: string) {
  const adminPw = process.env.ADMIN_PASSWORD
  if (!adminPw) return false
  return p === adminPw
}

// GET posts for a campaign
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password') || ''
  if (!checkAuth(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campaignId = req.nextUrl.searchParams.get('campaign_id')
  if (!campaignId) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

  const sb = getAdmin()
  const { data, error } = await sb
    .from('campaign_posts')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('step_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// CREATE post
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { data, error } = await sb.from('campaign_posts').insert({
    campaign_id: body.campaign_id,
    step_order: body.step_order || 1,
    title: body.title || null,
    subject_line: body.subject_line || null,
    preview_text: body.preview_text || null,
    body_content: body.body_content,
    body_html: body.body_html || null,
    platform: body.platform || 'email',
    delay_days: body.delay_days || 0,
    delay_hours: body.delay_hours || 0,
    status: body.status || 'draft',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// UPDATE post
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const fields = ['step_order', 'title', 'subject_line', 'preview_text', 'body_content', 'body_html', 'platform', 'delay_days', 'delay_hours', 'status']
  for (const f of fields) { if (body[f] !== undefined) updates[f] = body[f] }

  const { data, error } = await sb.from('campaign_posts').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE post
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()
  const { error } = await sb.from('campaign_posts').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
