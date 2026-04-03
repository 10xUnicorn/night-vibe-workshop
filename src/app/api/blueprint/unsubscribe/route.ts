import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')

  if (!email) {
    return new NextResponse(html('Invalid unsubscribe link.'), { headers: { 'Content-Type': 'text/html' } })
  }

  await supabase
    .from('blueprint_leads')
    .update({ nurture_status: 'unsubscribed', updated_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())

  return new NextResponse(html('You have been unsubscribed. You will no longer receive emails from this sequence.'), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function html(message: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Unsubscribe — Night Vibe</title></head>
<body style="margin:0;padding:0;background:#0d0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
<div style="max-width:480px;padding:48px 32px;text-align:center;">
  <p style="font-size:24px;font-weight:800;color:#fff;margin-bottom:16px;">Night Vibe</p>
  <p style="font-size:16px;color:#B0B0C5;line-height:1.7;">${message}</p>
  <a href="https://workshop.nightvibe.me" style="display:inline-block;margin-top:24px;color:#8B5CF6;text-decoration:underline;font-size:14px;">Back to workshop</a>
</div>
</body>
</html>`
}
