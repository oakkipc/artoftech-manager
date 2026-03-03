import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch all vendors
export async function GET() {
    try {
        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .order('name')

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ vendors: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a new vendor
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, contact_person, email, phone, address, category, rating, notes } = body

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('vendors')
            .insert({
                name,
                contact_person,
                email,
                phone,
                address,
                category,
                rating: rating || 0,
                notes
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ vendor: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PATCH: Update vendor details
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, name, contact_person, email, phone, address, category, rating, notes } = body

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('vendors')
            .update({
                name,
                contact_person,
                email,
                phone,
                address,
                category,
                rating,
                notes
            })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ vendor: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Remove a vendor
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { error } = await supabase
            .from('vendors')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
