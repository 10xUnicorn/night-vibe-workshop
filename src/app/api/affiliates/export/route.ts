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

// GET — export referrals as CSV with custom header mapping and column ordering
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password') || ''
  const slug = req.nextUrl.searchParams.get('slug')
  const affiliateId = req.nextUrl.searchParams.get('affiliate_id')
  const eventId = req.nextUrl.searchParams.get('event_id')
  // Column order: comma-separated list of column keys in desired order
  const columnOrder = req.nextUrl.searchParams.get('columns')?.split(',') || []
  // Header mapping: JSON-encoded { original_key: "Custom Header" }
  const headerMapStr = req.nextUrl.searchParams.get('headers')
  let headerMap: Record<string, string> = {}
  if (headerMapStr) {
    try { headerMap = JSON.parse(decodeURIComponent(headerMapStr)) } catch { /* use defaults */ }
  }

  const sb = getAdmin()
  let targetAffiliateId = affiliateId

  // Affiliate self-export by slug
  if (slug) {
    const { data: affiliate } = await sb
      .from('affiliates')
      .select('id')
      .eq('custom_slug', slug)
      .eq('status', 'active')
      .single()

    if (!affiliate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    targetAffiliateId = affiliate.id
  } else if (!checkAuth(password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let query = sb
    .from('affiliate_referrals')
    .select('*, affiliates(first_name, last_name, email, company), events(title), affiliate_links(tracking_code)')
    .order('created_at', { ascending: false })

  if (targetAffiliateId) query = query.eq('affiliate_id', targetAffiliateId)
  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'No data to export' }, { status: 404 })

  // Default available columns
  const defaultColumns = [
    'lead_first_name', 'lead_last_name', 'lead_email', 'status',
    'revenue', 'commission_amount', 'commission_paid', 'created_at',
    'affiliate_name', 'affiliate_email', 'event_title', 'tracking_code'
  ]

  const defaultHeaders: Record<string, string> = {
    lead_first_name: 'First Name',
    lead_last_name: 'Last Name',
    lead_email: 'Email',
    status: 'Status',
    revenue: 'Revenue',
    commission_amount: 'Commission',
    commission_paid: 'Commission Paid',
    created_at: 'Date',
    affiliate_name: 'Affiliate',
    affiliate_email: 'Affiliate Email',
    event_title: 'Event',
    tracking_code: 'Tracking Code',
  }

  // Use custom column order or defaults
  const cols = columnOrder.length > 0 ? columnOrder.filter(c => defaultColumns.includes(c)) : defaultColumns
  const headers = cols.map(c => headerMap[c] || defaultHeaders[c] || c)

  // Build rows
  type RefRow = Record<string, unknown> & {
    affiliates?: { first_name?: string; last_name?: string; email?: string }
    events?: { title?: string }
    affiliate_links?: { tracking_code?: string }
  }
  const rows = (data as RefRow[]).map(row => {
    const flat: Record<string, string> = {
      lead_first_name: String(row.lead_first_name || ''),
      lead_last_name: String(row.lead_last_name || ''),
      lead_email: String(row.lead_email || ''),
      status: String(row.status || ''),
      revenue: String(row.revenue || '0'),
      commission_amount: String(row.commission_amount || '0'),
      commission_paid: row.commission_paid ? 'Yes' : 'No',
      created_at: row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : '',
      affiliate_name: `${row.affiliates?.first_name || ''} ${row.affiliates?.last_name || ''}`.trim(),
      affiliate_email: String(row.affiliates?.email || ''),
      event_title: String(row.events?.title || ''),
      tracking_code: String(row.affiliate_links?.tracking_code || ''),
    }
    return cols.map(c => {
      const val = flat[c] || ''
      // Escape CSV values
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="affiliate-referrals-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
