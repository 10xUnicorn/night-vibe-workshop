import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Night Vibe Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// KnightOps Supabase — uses separate env vars
const knightops = process.env.KNIGHTOPS_SUPABASE_URL && process.env.KNIGHTOPS_SUPABASE_KEY
  ? createClient(process.env.KNIGHTOPS_SUPABASE_URL, process.env.KNIGHTOPS_SUPABASE_KEY)
  : null

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!knightops) {
    return NextResponse.json({ error: 'KnightOps credentials not configured' }, { status: 500 })
  }

  // Get un-synced blueprint leads
  const { data: leads, error } = await supabase
    .from('blueprint_leads')
    .select('*')
    .eq('knightops_synced', false)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error || !leads?.length) {
    return NextResponse.json({ synced: 0, message: error?.message || 'No leads to sync' })
  }

  let syncCount = 0

  for (const lead of leads) {
    try {
      // Check if lead already exists in KnightOps
      const { data: existingLead } = await knightops
        .from('leads')
        .select('id')
        .eq('email', lead.email)
        .single()

      let leadId = existingLead?.id

      // Create lead in KnightOps if not exists
      if (!leadId) {
        const { data: newLead } = await knightops
          .from('leads')
          .insert({
            name: lead.name,
            email: lead.email,
            company: lead.business_type,
            source: 'workshop_blueprint',
            notes: `Blueprint request: ${lead.biggest_problem}`,
            status: 'new',
            lead_type: 'inbound',
            engagement_tier: 'warm',
            metadata: { workshop_ref: lead.ref_code, submitted_at: lead.created_at },
          })
          .select('id')
          .single()

        leadId = newLead?.id
      }

      // Create intake submission in KnightOps
      const { data: intake } = await knightops
        .from('intake_submissions')
        .insert({
          first_name: lead.name.split(' ')[0],
          last_name: lead.name.split(' ').slice(1).join(' ') || null,
          email: lead.email,
          company: lead.business_type,
          bp_biggest_bottleneck: lead.biggest_problem,
          bp_time_sink: lead.biggest_problem,
          source: 'workshop_blueprint',
          status: 'new',
          lead_id: leadId || null,
          form_type: 'workshop_lead',
          utm_source: 'workshop.nightvibe.me',
          utm_campaign: 'blueprint_lead_magnet',
        })
        .select('id')
        .single()

      // Mark as synced in Night Vibe
      await supabase
        .from('blueprint_leads')
        .update({
          knightops_synced: true,
          knightops_intake_id: intake?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id)

      syncCount++
    } catch (err) {
      console.error(`Failed to sync lead ${lead.id}:`, err)
    }
  }

  return NextResponse.json({ synced: syncCount, total: leads.length })
}
