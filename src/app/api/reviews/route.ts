import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function checkAuth(password: string) {
  const adminPw = process.env.ADMIN_PASSWORD
  if (!adminPw) return false
  return password === adminPw
}

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET all reviews (admin)
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()
  const { data: reviews } = await sb
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: settings } = await sb
    .from('review_settings')
    .select('*')
    .single()

  return NextResponse.json({ reviews: reviews || [], settings })
}

// UPDATE review or settings
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()

  // Update review settings
  if (body.update_settings) {
    const { error } = await sb
      .from('review_settings')
      .update({ review_prompt: body.review_prompt, notification_email: body.notification_email, updated_at: new Date().toISOString() })
      .eq('id', body.settings_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Toggle public/private
  if (body.review_id && body.is_public !== undefined) {
    const { error } = await sb
      .from('reviews')
      .update({ is_public: body.is_public })
      .eq('id', body.review_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

// Add review manually
export async function PUT(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()
  const { error } = await sb.from('reviews').insert({
    name: body.name,
    company: body.company || null,
    review: body.review,
    stars: body.stars,
    media_urls: body.media_urls || [],
    is_public: body.is_public || false,
    source: 'manual',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Delete review
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = getAdmin()
  const { error } = await sb.from('reviews').delete().eq('id', body.review_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
