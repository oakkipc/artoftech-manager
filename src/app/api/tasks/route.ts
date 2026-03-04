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
            .select('*, task_assignees(user_id)')
            .eq('project_id', projectId)
            .order('position', { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Fetch all unique user IDs from all tasks
        const allUserIds = [...new Set((tasks || []).flatMap(t => t.task_assignees?.map((ta: any) => ta.user_id) || []))]
        let usersMap: Record<string, any> = {}

        if (allUserIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', allUserIds)
            if (usersData) {
                usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
            }
        }

        const enrichedTasks = (tasks || []).map(t => ({
            ...t,
            assignees: (t.task_assignees || []).map((ta: any) => usersMap[ta.user_id]).filter(Boolean)
        }))

        return NextResponse.json({ tasks: enrichedTasks })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a new task
export async function POST(request: Request) {
    try {
        const { projectId, title, description, status, assigneeIds, dueDate, categoryId } = await request.json()

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

        const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert({
                project_id: projectId,
                title,
                description: description || null,
                status: status || 'TODO',
                position,
                due_date: dueDate || null,
                category_id: categoryId || null
            })
            .select('*')
            .single()

        if (taskError) {
            return NextResponse.json({ error: taskError.message }, { status: 500 })
        }

        // Add multiple assignees
        if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
            const assigneeData = assigneeIds.map(userId => ({
                task_id: task.id,
                user_id: userId
            }))
            await supabase.from('task_assignees').insert(assigneeData)
        }

        // Fetch assignees
        const { data: assigneesData } = await supabase
            .from('task_assignees')
            .select('users(id, name, email)')
            .eq('task_id', task.id)

        const assignees = (assigneesData || []).map((a: any) => a.users)

        return NextResponse.json({ task: { ...task, assignees } })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
