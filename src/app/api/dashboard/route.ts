import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch projects visible to a user with task counts
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    try {
        const supabase = getAdminClient()

        let projects: any[] = []

        if (role === 'SUPERADMIN' || role === 'ADMIN') {
            // Admins see all projects
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            projects = data || []
        } else if (userId) {
            // Regular users see only assigned projects
            const { data, error } = await supabase
                .from('user_projects')
                .select(`
          project_id,
          role,
          projects:project_id (*)
        `)
                .eq('user_id', userId)

            if (error) throw error
            projects = (data || []).map((up: any) => up.projects).filter(Boolean)
        }

        // Get task counts for each project
        const projectsWithCounts = await Promise.all(
            projects.map(async (project: any) => {
                const { data: tasks } = await supabase
                    .from('tasks')
                    .select('status')
                    .eq('project_id', project.id)

                const taskList = tasks || []
                const total = taskList.length
                const done = taskList.filter((t: any) => t.status === 'DONE').length
                const inProgress = taskList.filter((t: any) => t.status === 'IN_PROGRESS').length
                const todo = taskList.filter((t: any) => t.status === 'TODO').length

                return {
                    ...project,
                    taskCounts: { total, done, inProgress, todo }
                }
            })
        )

        return NextResponse.json({ projects: projectsWithCounts })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
