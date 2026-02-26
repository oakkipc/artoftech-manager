import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// POST: Create domain
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const supabase = getAdminClient()

        const { data, error } = await supabase
            .from('domains')
            .insert({
                host_id: body.hostId,
                name: body.name,
                expiry_date: body.expiryDate || null,
                ssl_expiry: body.sslExpiry || null,
                registrar: body.registrar || null,
                notes: body.notes || null
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ domain: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Delete domain
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    try {
        const supabase = getAdminClient()
        const { error } = await supabase.from('domains').delete().eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
