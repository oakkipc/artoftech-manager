import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET /api/bot/projects — list all projects with task & checklist summary
// GET /api/bot/projects?projectId=xxx — get one project with full tasks + checklists
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    try {
        const supabase = getAdminClient()

        // Single project: full detail
        if (projectId) {
            // Fetch project
            const { data: project, error: projErr } = await supabase
                .from('projects')
                .select('*')
                .eq('id', projectId)
                .single()

            if (projErr || !project) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 })
            }

            // Fetch tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId)
                .order('status')
                .order('position', { ascending: true })

            // Fetch assigned users
            const userIds = [...new Set((tasks || []).filter(t => t.assigned_to).map(t => t.assigned_to))]
            let usersMap: Record<string, any> = {}
            if (userIds.length > 0) {
                const { data: usersData } = await supabase.from('users').select('id, name, email').in('id', userIds)
                if (usersData) usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
            }

            // Fetch all checklists for these tasks
            const taskIds = (tasks || []).map(t => t.id)
            let checklistsMap: Record<string, any[]> = {}
            if (taskIds.length > 0) {
                const { data: checklists } = await supabase
                    .from('checklists')
                    .select('*')
                    .in('task_id', taskIds)
                    .order('position', { ascending: true })

                if (checklists) {
                    checklists.forEach(c => {
                        if (!checklistsMap[c.task_id]) checklistsMap[c.task_id] = []
                        checklistsMap[c.task_id].push(c)
                    })
                }
            }

            // Fetch members
            const { data: membersData } = await supabase
                .from('user_projects')
                .select('user_id, role')
                .eq('project_id', projectId)

            const memberUserIds = (membersData || []).map(m => m.user_id)
            let membersInfo: any[] = []
            if (memberUserIds.length > 0) {
                const { data: mUsers } = await supabase.from('users').select('id, name, email').in('id', memberUserIds)
                const roleMap = Object.fromEntries((membersData || []).map(m => [m.user_id, m.role]))
                membersInfo = (mUsers || []).map(u => ({ ...u, role: roleMap[u.id] || 'VIEWER' }))
            }

            // Assemble response
            const now = new Date()
            const enrichedTasks = (tasks || []).map(t => {
                const checklists = checklistsMap[t.id] || []
                const checklistTotal = checklists.length
                const checklistDone = checklists.filter((c: any) => c.completed).length
                return {
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    status: t.status,
                    position: t.position,
                    due_date: t.due_date,
                    is_overdue: t.due_date && new Date(t.due_date) < now && t.status !== 'DONE',
                    assigned_to: t.assigned_to ? usersMap[t.assigned_to] || null : null,
                    checklist_progress: checklistTotal > 0 ? `${checklistDone}/${checklistTotal}` : null,
                    checklists: checklists.map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        completed: c.completed
                    })),
                    created_at: t.created_at
                }
            })

            const totalTasks = enrichedTasks.length
            const doneTasks = enrichedTasks.filter(t => t.status === 'DONE').length

            return NextResponse.json({
                project: {
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    status: project.status,
                    pinned: project.pinned,
                    created_at: project.created_at
                },
                summary: {
                    total_tasks: totalTasks,
                    todo: enrichedTasks.filter(t => t.status === 'TODO').length,
                    in_progress: enrichedTasks.filter(t => t.status === 'IN_PROGRESS').length,
                    done: doneTasks,
                    overdue: enrichedTasks.filter(t => t.is_overdue).length,
                    completion_rate: totalTasks > 0 ? `${Math.round((doneTasks / totalTasks) * 100)}%` : '0%',
                    members: membersInfo.length
                },
                members: membersInfo,
                tasks: enrichedTasks
            })
        }

        // List all projects with summary
        const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false })

        const { data: allTasks } = await supabase.from('tasks').select('id, project_id, status, due_date')
        const now = new Date()

        const projectList = (projects || []).map(p => {
            const pTasks = (allTasks || []).filter(t => t.project_id === p.id)
            const total = pTasks.length
            const done = pTasks.filter(t => t.status === 'DONE').length
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                status: p.status,
                pinned: p.pinned,
                summary: {
                    total_tasks: total,
                    todo: pTasks.filter(t => t.status === 'TODO').length,
                    in_progress: pTasks.filter(t => t.status === 'IN_PROGRESS').length,
                    done,
                    overdue: pTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length,
                    completion_rate: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%'
                },
                detail_url: `/api/bot/projects?projectId=${p.id}`
            }
        })

        return NextResponse.json({ projects: projectList })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
