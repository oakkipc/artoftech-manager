import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch notes for a project
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('project_notes')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ notes: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Add a note
export async function POST(request: Request) {
    try {
        const { projectId, content, authorId } = await request.json()

        if (!projectId || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('project_notes')
            .insert({
                project_id: projectId,
                content,
                author_id: authorId || null
            })
            .select()
            .single()

        if (error) {
            console.error('[ProjectNotes API POST] Supabase Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ note: data })
    } catch (err) {
        console.error('[ProjectNotes API POST] Server Error:', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Remove a note
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { error } = await supabase
            .from('project_notes')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT: Update a note
export async function PUT(request: Request) {
    try {
        const { id, content } = await request.json()

        if (!id || !content) {
            return NextResponse.json({ error: 'Missing id or content' }, { status: 400 })
        }

        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('project_notes')
            .update({ content })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ note: data })
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
