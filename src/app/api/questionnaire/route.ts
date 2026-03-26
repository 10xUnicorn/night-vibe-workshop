import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { app_idea, problem, target_customer, existing_business, biggest_challenge, technical_level, event_id, email } = body

    if (!app_idea || !problem) {
      return NextResponse.json({ error: 'App idea and problem are required' }, { status: 400 })
    }

    const sb = createClient(supabaseUrl, supabaseServiceKey)
    const { data, error } = await sb
      .from('app_questionnaires')
      .insert({
        event_id: event_id || null,
        email: email || null,
        app_idea,
        problem,
        target_customer: target_customer || null,
        existing_business: existing_business || null,
        biggest_challenge: biggest_challenge || null,
        technical_level: technical_level || null,
      } as any)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Questionnaire error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
