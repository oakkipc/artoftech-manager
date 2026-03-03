import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(supabaseUrl, serviceRoleKey)
}

// GET: Fetch budget transactions
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const type = searchParams.get('type') // INCOME or EXPENSE
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    try {
        const supabase = getAdminClient()
        let query = supabase
            .from('project_budgets')
            .select('*, projects(name), vendors(name)')
            .order('date', { ascending: false })

        if (projectId) query = query.eq('project_id', projectId)
        if (type) query = query.eq('type', type)
        if (startDate) query = query.gte('date', startDate)
        if (endDate) query = query.lte('date', endDate)

        const { data, error } = await query

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ transactions: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Add a budget transaction
export async function POST(request: Request) {
    try {
        const { projectId, amount, type, description, date, vendorId } = await request.json()

        if (!projectId || !amount || !type || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = getAdminClient()
        const { data, error } = await supabase
            .from('project_budgets')
            .insert({
                project_id: projectId,
                amount: parseFloat(amount),
                type,
                description,
                date,
                vendor_id: vendorId || null
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ transaction: data })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// DELETE: Remove a budget transaction
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    try {
        const supabase = getAdminClient()
        const { error } = await supabase
            .from('project_budgets')
            .delete()
            .eq('id', id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
