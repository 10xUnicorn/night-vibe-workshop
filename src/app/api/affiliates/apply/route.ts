import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function generateSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-')
}

// POST - Submit affiliate application (public, no auth required)
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Validate required fields
  if (!body.first_name?.trim() || !body.last_name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 })
  }

  const sb = getAdmin()
  const emailLower = body.email.trim().toLowerCase()

  // Check for duplicate email
  const { data: existingAffiliate, error: checkError } = await sb
    .from('affiliates')
    .select('id')
    .eq('email', emailLower)
    .single()

  if (existingAffiliate) {
    return NextResponse.json({ error: 'An application with this email already exists' }, { status: 400 })
  }

  // Generate slug from name
  const slug = generateSlug(body.first_name.trim(), body.last_name.trim())

  // Create affiliate with pending status and default 15% commission
  const { data: affiliate, error } = await sb.from('affiliates').insert({
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    email: emailLower,
    phone: body.phone?.trim() || null,
    company: body.company?.trim() || null,
    website_url: body.website_url?.trim() || null,
    partnership_reason: body.partnership_reason?.trim() || null,
    commission_rate: 15,
    custom_slug: slug,
    status: 'pending',
    notes: null,
    bio: null,
  }).select().single()

  if (error) {
    console.error('Error creating affiliate:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(affiliate, { status: 201 })
}
