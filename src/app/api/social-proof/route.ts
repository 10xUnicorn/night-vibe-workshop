import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function checkAuth(password: string) {
  return password === (process.env.ADMIN_PASSWORD || 'nightvibe2026')
}

export async function GET() {
  try {
    const sb = createClient(supabaseUrl, supabaseAnonKey)
    const { data, error } = await sb
      .from('social_proof_entries')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Social proof fetch error:', err)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!checkAuth(body.password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const sb = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await sb
      .from('social_proof_entries')
      .insert({
        name: body.name,
        location: body.location,
        event_id: body.event_id || null,
        workshop_name: body.workshop_name,
        is_active: body.is_active !== false,
        display_order: body.display_order || 0,
      } as any)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Social proof create error:', err)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    if (!checkAuth(body.password)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const sb = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await sb.from('social_proof_entries').delete().eq('id', body.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Social proof delete error:', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
