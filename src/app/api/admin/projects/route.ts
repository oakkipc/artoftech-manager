import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '@/lib/logger'

const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  try {
    const supabase = getAdminClient()

    let query = supabase
      .from('projects')
      .select('*, clients(name)')
      .order('pin_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (id) query = query.eq('id', id)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (id) {
      return NextResponse.json({ project: data?.[0] || null })
    }
    return NextResponse.json({ projects: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, ownerId, clientId } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อโปรเจค' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, status: 'ACTIVE', client_id: clientId || null })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add owner as ADMIN of the project
    if (ownerId) {
      await supabase
        .from('user_projects')
        .insert({ user_id: ownerId, project_id: data.id, role: 'ADMIN' })
    }

    // Log Activity
    await logActivity({
      userId: ownerId || null,
      action: 'CREATE',
      entityType: 'PROJECT',
      entityId: data.id,
      details: { name: data.name }
    })

    return NextResponse.json({ project: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { projectId, pinned, pinOrder, userId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    const updateData: any = {}
    if (pinned !== undefined) updateData.pinned = pinned
    if (pinOrder !== undefined) updateData.pin_order = pinOrder

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log Activity
    if (pinned !== undefined) {
      await logActivity({
        userId: userId || null,
        action: pinned ? 'PIN' : 'UPDATE',
        entityType: 'PROJECT',
        entityId: projectId,
        details: { pinned, name: data.name }
      })
    } else if (pinOrder !== undefined) {
      await logActivity({
        userId: userId || null,
        action: 'REORDER',
        entityType: 'PROJECT',
        entityId: projectId,
        details: { pinOrder, name: data.name }
      })
    }

    return NextResponse.json({ project: data })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
