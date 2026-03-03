import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    try {
        const supabase = getAdminClient()

        let projects: any[] = []

        if (role === 'SUPERADMIN' || role === 'ADMIN') {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            projects = data || []
        } else if (userId) {
            const { data, error } = await supabase
                .from('user_projects')
                .select('project_id, role')
                .eq('user_id', userId)
            if (error) throw error
            const projectIds = (data || []).map((up: any) => up.project_id)
            if (projectIds.length > 0) {
                const { data: projData } = await supabase
                    .from('projects')
                    .select('*')
                    .in('id', projectIds)
                    .order('created_at', { ascending: false })
                projects = projData || []
            }
        }

        // Get ALL tasks for these projects
        const projectIds = projects.map(p => p.id)
        let allTasks: any[] = []

        if (projectIds.length > 0) {
            const { data: tasksData } = await supabase
                .from('tasks')
                .select('*')
                .in('project_id', projectIds)
            allTasks = tasksData || []
        }

        // Fetch assigned users for tasks
        const userIds = [...new Set(allTasks.filter(t => t.assigned_to).map(t => t.assigned_to))]
        let usersMap: Record<string, any> = {}
        if (userIds.length > 0) {
            const { data: usersData } = await supabase
                .from('users')
                .select('id, name, email')
                .in('id', userIds)
            if (usersData) usersMap = Object.fromEntries(usersData.map(u => [u.id, u]))
        }

        // Get team members count per project
        let memberCounts: Record<string, number> = {}
        if (projectIds.length > 0) {
            const { data: upData } = await supabase
                .from('user_projects')
                .select('project_id')
                .in('project_id', projectIds)
            if (upData) {
                upData.forEach((up: any) => {
                    memberCounts[up.project_id] = (memberCounts[up.project_id] || 0) + 1
                })
            }
        }

        // Compute per-project stats
        const now = new Date()
        const projectsWithCounts = projects.map((project: any) => {
            const projectTasks = allTasks.filter(t => t.project_id === project.id)
            const total = projectTasks.length
            const done = projectTasks.filter(t => t.status === 'DONE').length
            const inProgress = projectTasks.filter(t => t.status === 'IN_PROGRESS').length
            const todo = projectTasks.filter(t => t.status === 'TODO').length
            const overdue = projectTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length

            return {
                ...project,
                memberCount: memberCounts[project.id] || 0,
                taskCounts: { total, done, inProgress, todo, overdue }
            }
        })

        // Global stats
        const totalTasks = allTasks.length
        const totalDone = allTasks.filter(t => t.status === 'DONE').length
        const totalInProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length
        const totalTodo = allTasks.filter(t => t.status === 'TODO').length
        const totalOverdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE').length

        // Upcoming deadlines (next 7 days, not done)
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const upcomingTasks = allTasks
            .filter(t => t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= in7Days && t.status !== 'DONE')
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5)
            .map(t => ({
                ...t,
                assigned_user: t.assigned_to ? usersMap[t.assigned_to] || null : null,
                projectName: projects.find((p: any) => p.id === t.project_id)?.name || ''
            }))

        // Overdue tasks
        const overdueTasks = allTasks
            .filter(t => t.due_date && new Date(t.due_date) < now && t.status !== 'DONE')
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 5)
            .map(t => ({
                ...t,
                assigned_user: t.assigned_to ? usersMap[t.assigned_to] || null : null,
                projectName: projects.find((p: any) => p.id === t.project_id)?.name || ''
            }))

        // My tasks (assigned to current user, not done)
        const myTasks = userId
            ? allTasks
                .filter(t => t.assigned_to === userId && t.status !== 'DONE')
                .sort((a, b) => {
                    // Overdue first, then by due date, then no-date last
                    const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity
                    const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity
                    return aDate - bDate
                })
                .map(t => ({
                    ...t,
                    assigned_user: t.assigned_to ? usersMap[t.assigned_to] || null : null,
                    projectName: projects.find((p: any) => p.id === t.project_id)?.name || ''
                }))
            : []

        // Financial Stats (for SUPERADMIN only)
        let financialStats = null
        if (role === 'SUPERADMIN') {
            const { data: budgetData } = await supabase
                .from('project_budgets')
                .select('amount, type, frequency, date, end_date')

            if (budgetData) {
                // Calculation logic similar to stakeholders dashboard (current month view)
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

                let revenue = 0
                let expense = 0

                budgetData.forEach(t => {
                    if (t.frequency === 'ONCE') {
                        const d = new Date(t.date)
                        if (d >= startOfMonth && d <= endOfMonth) {
                            if (t.type === 'INCOME') revenue += Number(t.amount)
                            else expense += Number(t.amount)
                        }
                    } else {
                        let current = new Date(t.date)
                        const tEnd = t.end_date ? new Date(t.end_date) : endOfMonth
                        const limit = tEnd > endOfMonth ? endOfMonth : tEnd

                        while (current <= limit) {
                            if (current >= startOfMonth) {
                                if (t.type === 'INCOME') revenue += Number(t.amount)
                                else expense += Number(t.amount)
                            }
                            if (t.frequency === 'MONTHLY') current.setMonth(current.getMonth() + 1)
                            else if (t.frequency === 'YEARLY') current.setFullYear(current.getFullYear() + 1)
                            else break
                        }
                    }
                })

                financialStats = {
                    revenue,
                    expense,
                    balance: revenue - expense
                }
            }
        }

        return NextResponse.json({
            projects: projectsWithCounts,
            stats: {
                totalProjects: projects.length,
                totalTasks,
                totalDone,
                totalInProgress,
                totalTodo,
                totalOverdue,
                completionRate: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
                cashflow: financialStats
            },
            upcomingTasks,
            overdueTasks,
            myTasks
        })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
