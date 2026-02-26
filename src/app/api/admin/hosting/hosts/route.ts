import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// POST: Create host
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = getAdminClient()

        const { data, error } = await supabase
            .from('hosts')
            .insert({
                provider_id: body.providerId,
                name: body.name,
                ip_address: body.ipAddress || null,
                plan: body.plan || null,
                expiry_date: body.expiryDate || null,
                notes: body.notes || null
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ host: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Delete host
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    try {
        const supabase = getAdminClient()
        const { error } = await supabase.from('hosts').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
