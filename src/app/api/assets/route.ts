import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function checkAuth(p: string) {
  const adminPw = process.env.ADMIN_PASSWORD
  if (!adminPw) return false
  return p === adminPw
}

// ─── FOLDERS ────────────────────────────────────────────────────

// GET folders + assets
export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password') || ''
  const partnerMode = req.nextUrl.searchParams.get('partner')
  const folderId = req.nextUrl.searchParams.get('folder_id')
  const sb = getAdmin()

  // Partner mode: return only partner-visible folders and assets (no auth required)
  if (partnerMode === 'true') {
    const { data: folders } = await sb
      .from('asset_folders')
      .select('*')
      .eq('partner_visible', true)
      .order('sort_order')

    let assetsQuery = sb.from('assets').select('*').eq('partner_visible', true).order('created_at', { ascending: false })
    if (folderId) {
      assetsQuery = assetsQuery.eq('folder_id', folderId)
    }
    const { data: assets } = await assetsQuery

    return NextResponse.json({ folders: folders || [], assets: assets || [] })
  }

  // Admin mode: full access with password
  if (!checkAuth(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get folders
  const { data: folders, error: fErr } = await sb
    .from('asset_folders')
    .select('*')
    .order('sort_order')

  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 })

  // Get assets (optionally filtered by folder)
  let assetsQuery = sb.from('assets').select('*').order('created_at', { ascending: false })
  if (folderId) {
    assetsQuery = assetsQuery.eq('folder_id', folderId)
  }
  const { data: assets, error: aErr } = await assetsQuery

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

  return NextResponse.json({ folders: folders || [], assets: assets || [] })
}

// POST — create folder or upload asset
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const sb = getAdmin()

  // Handle file upload (multipart)
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const password = formData.get('password') as string
    if (!checkAuth(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const file = formData.get('file') as File | null
    const folderId = formData.get('folder_id') as string | null
    const name = formData.get('name') as string || file?.name || 'Untitled'
    const type = formData.get('type') as string || 'image'
    const partnerVisible = formData.get('partner_visible') === 'true' ? true : false

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const storagePath = folderId ? `${folderId}/${fileName}` : fileName

    const { error: uploadErr } = await sb.storage
      .from('assets')
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

    // Get public URL
    const { data: urlData } = sb.storage.from('assets').getPublicUrl(storagePath)

    // Create asset record
    const { data: asset, error: dbErr } = await sb.from('assets').insert({
      folder_id: folderId || null,
      name,
      type,
      url: urlData.publicUrl,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      partner_visible: partnerVisible,
    }).select().single()

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
    return NextResponse.json(asset, { status: 201 })
  }

  // Handle JSON (create folder or URL-based asset)
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (body.action === 'create_folder') {
    if (!body.name?.trim()) return NextResponse.json({ error: 'Folder name required' }, { status: 400 })

    const { data, error } = await sb.from('asset_folders').insert({
      name: body.name.trim(),
      description: body.description || null,
      parent_folder_id: body.parent_folder_id || null,
      sort_order: body.sort_order || 0,
      partner_visible: body.partner_visible || false,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  if (body.action === 'create_asset_url') {
    if (!body.name?.trim() || !body.url?.trim()) {
      return NextResponse.json({ error: 'Name and URL required' }, { status: 400 })
    }

    const { data, error } = await sb.from('assets').insert({
      folder_id: body.folder_id || null,
      name: body.name.trim(),
      type: body.type || 'image',
      url: body.url.trim(),
      mime_type: body.mime_type || null,
      partner_visible: body.partner_visible || false,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// PATCH — update folder or asset
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const sb = getAdmin()

  if (body.target === 'folder') {
    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.description !== undefined) updates.description = body.description
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order
    if (body.partner_visible !== undefined) updates.partner_visible = body.partner_visible

    const { data, error } = await sb.from('asset_folders').update(updates).eq('id', body.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Update asset
  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.folder_id !== undefined) updates.folder_id = body.folder_id
  if (body.url !== undefined) updates.url = body.url
  if (body.partner_visible !== undefined) updates.partner_visible = body.partner_visible

  const { data, error } = await sb.from('assets').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE folder or asset
export async function DELETE(req: NextRequest) {
  const body = await req.json()
  if (!checkAuth(body.password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getAdmin()

  if (body.target === 'folder') {
    const { error } = await sb.from('asset_folders').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Delete asset — also remove from storage
  if (body.storage_path) {
    await sb.storage.from('assets').remove([body.storage_path])
  }

  const { error } = await sb.from('assets').delete().eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
