import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch checklists for a task
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
        return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    try {
        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('checklists')
            .select('*')
            .eq('task_id', taskId)
            .order('position', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ checklists: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a checklist item
export async function POST(request: Request) {
    try {
        const { taskId, title } = await request.json()

        if (!taskId || !title) {
            return NextResponse.json({ error: 'taskId and title are required' }, { status: 400 })
        }

        const supabase = getAdminClient()

        // Get max position
        const { data: maxPos } = await supabase
            .from('checklists')
            .select('position')
            .eq('task_id', taskId)
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle()

        const position = (maxPos?.position ?? -1) + 1

        const { data, error } = await supabase
            .from('checklists')
            .insert({ task_id: taskId, title, completed: false, position })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ checklist: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PUT: Toggle checklist item
export async function PUT(request: Request) {
    try {
        const { id, completed, title } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 })
        }

        const supabase = getAdminClient()
        const updateData: any = {}
        if (completed !== undefined) updateData.completed = completed
        if (title !== undefined) updateData.title = title

        const { data, error } = await supabase
            .from('checklists')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ checklist: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Remove checklist item
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    try {
        const supabase = getAdminClient()
        const { error } = await supabase
            .from('checklists')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ message: 'Deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
