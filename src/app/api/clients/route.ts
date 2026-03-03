import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch all clients
export async function GET() {
    try {
        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ clients: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Create a new client
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, contact_person, email, phone, address, company_tax_id, rating, notes, credit_term } = body

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const supabase = getAdminClient()

        const { data, error } = await supabase
            .from('clients')
            .insert({
                name,
                contact_person,
                email,
                phone,
                address,
                company_tax_id,
                rating: rating || 0,
                notes,
                credit_term: credit_term || 0
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ client: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// PATCH: Update client details
export async function PATCH(request: Request) {
    try {
        const { id, name, contact_person, email, phone, address, company_tax_id, rating, notes, credit_term } = await request.json()
        if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('clients')
            .update({
                name,
                contact_person,
                email,
                phone,
                address,
                company_tax_id,
                rating,
                notes,
                credit_term
            })
            .eq('id', id)
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ client: data })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Remove a client
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
