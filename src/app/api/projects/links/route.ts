import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '@/lib/logger'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch links for a project
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('project_links')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ links: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a link
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = getAdminClient()

        const { data, error } = await supabase
            .from('project_links')
            .insert({
                project_id: body.projectId,
                label: body.label,
                url: body.url,
                type: body.type || 'OTHER'
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Log Activity
        await logActivity({
            userId: body.userId || null,
            action: 'CREATE',
            entityType: 'LINK',
            entityId: data.id,
            details: { label: data.label, projectId: data.project_id }
        })

        return NextResponse.json({ link: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Remove a link
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    try {
        const supabase = getAdminClient()
        const { error } = await supabase.from('project_links').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Log Activity
        const userId = searchParams.get('userId')
        await logActivity({
            userId: userId || null,
            action: 'DELETE',
            entityType: 'LINK',
            entityId: id,
            details: { id }
        })

        return NextResponse.json({ message: 'Deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
