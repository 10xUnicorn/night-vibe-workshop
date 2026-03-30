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

function generateSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}

function generateTrackingCode(): string {
  return 'nv-' + Math.random().toString(36).substring(2, 10)
}

// GET all affiliates (admin) or self-lookup by slug or email
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password') || ''
  const slug = req.nextUrl.searchParams.get('slug')
  const email = req.nextUrl.searchParams.get('email')

  const sb = getAdmin()

  // Self-lookup by slug
  if (slug) {
    const trimmed = slug.trim().toLowerCase()
    if (!trimmed) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

    const { data, error } = await sb
      .from('affiliates')
      .select('id, first_name, last_name, email, company, custom_slug, status, role, created_at')
      .eq('custom_slug', trimmed)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  // Self-lookup by email
  if (email) {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

    const { data, error } = await sb
      .from('affiliates')
      .select('id, first_name, last_name, email, company, custom_slug, status, role, created_at')
      .eq('email', trimmed)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }
    return NextResponse.json(data)
  }

  // Admin: list all
  if (!checkAuth(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await sb
    .from('affiliates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

// CREATE affiliate (admin)
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate required fields
  if (!body.first_name?.trim() || !body.last_name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'first_name, last_name, and email are required' }, { status: 400 })
  }

  const sb = getAdmin()
  const slug = body.custom_slug?.trim() || generateSlug(body.first_name.trim(), body.last_name.trim())

  const { data: affiliate, error } = await sb.from('affiliates').insert({
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone || null,
    company: body.company || null,
    commission_rate: Math.max(0, Math.min(100, parseFloat(body.commission_rate) || 0)),
    custom_slug: slug,
    bio: body.bio || null,
    notes: body.notes || null,
    status: body.status || 'active',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-create tracking links for all published events
  if (body.auto_create_links) {
    const { data: events } = await sb
      .from('events')
      .select('id')
      .eq('status', 'published')

    if (events?.length) {
      const links = events.map(ev => ({
        affiliate_id: affiliate.id,
        event_id: ev.id,
        tracking_code: generateTrackingCode(),
      }))
      const { error: linkErr } = await sb.from('affiliate_links').insert(links)
      if (linkErr) console.error('Failed to create affiliate links:', linkErr.message)
    }
  }

  return NextResponse.json(affiliate, { status: 201 })
}

// UPDATE affiliate (admin)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const sb = getAdmin()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  const fields = ['first_name', 'last_name', 'email', 'phone', 'company', 'commission_rate', 'custom_slug', 'bio', 'notes', 'status']
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  // Clamp commission rate
  if (updates.commission_rate !== undefined) {
    updates.commission_rate = Math.max(0, Math.min(100, parseFloat(String(updates.commission_rate)) || 0))
  }

  const { data, error } = await sb
    .from('affiliates')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE affiliate (admin)
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const sb = getAdmin()
  const { error } = await sb.from('affiliates').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
