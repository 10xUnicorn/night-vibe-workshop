import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  const adminPass = process.env.ADMIN_PASSWORD || 'nightvibe2026'

  if (password === adminPass) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
