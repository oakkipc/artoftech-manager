import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '@/lib/logger'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch categories for a project
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('task_categories')
            .select('*')
            .eq('project_id', projectId)
            .order('name')

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ categories: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a category
export async function POST(request: Request) {
    try {
        const body = await request.clone().json().catch(() => ({}))
        const { projectId, name, color, userId } = body
        if (!projectId || !name?.trim()) return NextResponse.json({ error: 'projectId and name required' }, { status: 400 })

        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('task_categories')
            .insert({ project_id: projectId, name: name.trim(), color: color || '#8b5cf6' })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Log Activity
        await logActivity({
            userId: userId || null,
            action: 'CREATE',
            entityType: 'CATEGORY',
            entityId: data.id,
            details: { name: data.name, projectId: data.project_id }
        })

        return NextResponse.json({ category: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Delete a category
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { error } = await supabase.from('task_categories').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Log Activity
        const userId = searchParams.get('userId')
        await logActivity({
            userId: userId || null,
            action: 'DELETE',
            entityType: 'CATEGORY',
            entityId: id,
            details: { id }
        })

        return NextResponse.json({ message: 'Deleted' })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PATCH: Update a category
export async function PATCH(request: Request) {
    try {
        const body = await request.clone().json().catch(() => ({}))
        const { id, name, color, userId } = body
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

        const supabase = getAdminClient()
        const updateData: any = {}
        if (name !== undefined) updateData.name = name.trim()
        if (color !== undefined) updateData.color = color

        const { data, error } = await supabase
            .from('task_categories')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Log Activity
        await logActivity({
            userId: userId || null,
            action: 'UPDATE',
            entityType: 'CATEGORY',
            entityId: id,
            details: { name: data.name, projectId: data.project_id }
        })

        return NextResponse.json({ category: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
