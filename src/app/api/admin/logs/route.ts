import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')

    try {
        const supabase = getAdminClient()

        let query = supabase
            .from('activity_logs')
            .select('*, users(name, email)')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (entityType) query = query.eq('entity_type', entityType)
        if (userId) query = query.eq('user_id', userId)

        const { data, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ logs: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
