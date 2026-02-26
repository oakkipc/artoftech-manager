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

        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('position', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Fetch assigned users separately
        const userIds = [...new Set((tasks || []).filter(t => t.assigned_to).map(t => t.assigned_to))]
        let usersMap: Record<string, any> = {}

        if (userIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', userIds)
            if (usersData) {
                usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
            }
        }

        const enrichedTasks = (tasks || []).map(t => ({
            ...t,
            assigned_user: t.assigned_to ? usersMap[t.assigned_to] || null : null
        }))

        return NextResponse.json({ tasks: enrichedTasks })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a new task
export async function POST(request: Request) {
    try {
        const { projectId, title, description, status, assignedTo, dueDate, categoryId } = await request.json()

        if (!projectId || !title) {
            return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 })
        }

        const supabase = getAdminClient()

        // Get the max position
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
                assigned_to: assignedTo || null,
                due_date: dueDate || null,
                category_id: categoryId || null
            })
            .select('*')
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Fetch assigned user
        let assigned_user = null
        if (data.assigned_to) {
            const { data: userData } = await supabase
                .from('users')
                .select('id, name, email')
                .eq('id', data.assigned_to)
                .single()
            assigned_user = userData
        }

        return NextResponse.json({ task: { ...data, assigned_user } })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
