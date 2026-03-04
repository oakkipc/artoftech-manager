import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logActivity } from '@/lib/logger'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// PUT: Update a task
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await request.json()

        const supabase = getAdminClient()

        const updateData: any = {}
        if (body.title !== undefined) updateData.title = body.title
        if (body.description !== undefined) updateData.description = body.description
        if (body.status !== undefined) updateData.status = body.status
        if (body.position !== undefined) updateData.position = body.position
        if (body.dueDate !== undefined) updateData.due_date = body.dueDate
        if (body.due_date !== undefined) updateData.due_date = body.due_date
        if (body.categoryId !== undefined) updateData.category_id = body.categoryId
        if (body.category_id !== undefined) updateData.category_id = body.category_id
        let task = null
        if (Object.keys(updateData).length > 0) {
            const { data: updatedTask, error: updateError } = await supabase
                .from('tasks')
                .update(updateData)
                .eq('id', id)
                .select('*')
                .single()

            if (updateError) {
                return NextResponse.json({ error: updateError.message }, { status: 500 })
            }
            task = updatedTask
        } else {
            // Just fetch the task if no fields to update
            const { data: existingTask } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single()
            task = existingTask
        }

        // Sync assignees if provided
        if (body.assigneeIds !== undefined && Array.isArray(body.assigneeIds)) {
            // Remove existing
            await supabase
                .from('task_assignees')
                .delete()
                .eq('task_id', id)

            // Insert new
            if (body.assigneeIds.length > 0) {
                const assigneeData = body.assigneeIds.map((userId: string) => ({
                    task_id: id,
                    user_id: userId
                }))
                await supabase.from('task_assignees').insert(assigneeData)
            }
        }

        // Log Activity
        await logActivity({
            userId: body.userId || null,
            action: 'UPDATE',
            entityType: 'TASK',
            entityId: id,
            details: {
                title: task.title,
                updates: Object.keys(updateData),
                assigneeCount: body.assigneeIds?.length
            }
        })

        // Fetch current assignees
        const { data: assigneesData } = await supabase
            .from('task_assignees')
            .select('users(id, name, email)')
            .eq('task_id', id)

        const assignees = (assigneesData || []).map((a: any) => a.users).filter(Boolean)

        // Fetch checklist stats
        const { data: checklistData } = await supabase
            .from('task_checklists')
            .select('completed')
            .eq('task_id', id)

        const checklistStats = {
            total: checklistData?.length || 0,
            completed: checklistData?.filter((c: any) => c.completed).length || 0
        }

        return NextResponse.json({ task: { ...task, assignees, checklistStats } })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Delete a task
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        const supabase = getAdminClient()

        // Get task info before deleting for log
        const { data: taskData } = await supabase
            .from('tasks')
            .select('title')
            .eq('id', id)
            .single()

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Log Activity
        await logActivity({
            userId: userId || null,
            action: 'DELETE',
            entityType: 'TASK',
            entityId: id,
            details: { title: taskData?.title }
        })

        return NextResponse.json({ message: 'Deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
