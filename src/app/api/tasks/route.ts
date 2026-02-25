import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch tasks for a project
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
        return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    try {
        const supabase = getAdminClient()

        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        assigned_user:assigned_to (id, name, email)
      `)
            .eq('project_id', projectId)
            .order('position', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ tasks: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a new task
export async function POST(request: Request) {
    try {
        const { projectId, title, description, status, assignedTo } = await request.json()

        if (!projectId || !title) {
            return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 })
        }

        const supabase = getAdminClient()

        // Get the max position for this project + status
        const { data: maxPos } = await supabase
            .from('tasks')
            .select('position')
            .eq('project_id', projectId)
            .eq('status', status || 'TODO')
            .order('position', { ascending: false })
            .limit(1)
            .maybeSingle()

        const position = (maxPos?.position ?? -1) + 1

        const { data, error } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                title,
                description: description || null,
                status: status || 'TODO',
                position,
                assigned_to: assignedTo || null
            })
            .select(`
        *,
        assigned_user:assigned_to (id, name, email)
      `)
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ task: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
