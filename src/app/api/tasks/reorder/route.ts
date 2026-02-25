import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// PUT: Batch reorder tasks after drag & drop
export async function PUT(request: Request) {
    try {
        const { tasks } = await request.json()

        if (!tasks || !Array.isArray(tasks)) {
            return NextResponse.json({ error: 'tasks array is required' }, { status: 400 })
        }

        const supabase = getAdminClient()

        // Update each task's status and position
        const updates = tasks.map((task: { id: string; status: string; position: number }) =>
            supabase
                .from('tasks')
                .update({ status: task.status, position: task.position })
                .eq('id', task.id)
        )

        await Promise.all(updates)

        return NextResponse.json({ message: 'Reordered' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
