import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PIN' | 'REORDER' | 'LOGIN' | 'ARCHIVE'
export type ActivityEntity = 'PROJECT' | 'TASK' | 'BUDGET' | 'LINK' | 'NOTE' | 'USER' | 'CATEGORY' | 'CHECKLIST'

interface LogParams {
    userId: string | null
    action: ActivityAction
    entityType: ActivityEntity
    entityId?: string | null
    details?: Record<string, any>
}

/**
 * Standardized utility to record user activity in the database.
 */
export async function logActivity({
    userId,
    action,
    entityType,
    entityId,
    details = {}
}: LogParams) {
    try {
        const supabase = getAdminClient()

        const { error } = await supabase.from('activity_logs').insert({
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details
        })

        if (error) {
            console.error('[Logger Error]:', error.message)
        }
    } catch (err) {
        console.error('[Logger Runtime Error]:', err)
    }
}
