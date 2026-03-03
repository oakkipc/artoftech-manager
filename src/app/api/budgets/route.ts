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
    const clientId = searchParams.get('clientId')

    try {
        const supabase = getAdminClient()

        let query = supabase
            .from('project_budgets')
            .select('*, projects(name), vendors(name), clients(name)')
            .order('date', { ascending: false })

        if (projectId) query = query.eq('project_id', projectId)
        if (type) query = query.eq('type', type)
        if (clientId) query = query.eq('client_id', clientId)

        // For recurring logic, we fetch a bit more than just the range if startDate/endDate are present
        const { data, error } = await query

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Expand recurring transactions
        let expandedTransactions: any[] = []
        const start = startDate ? new Date(startDate) : null
        const end = endDate ? new Date(endDate) : null

            ; (data || []).forEach(t => {
                if (t.frequency === 'ONCE') {
                    // One-time: check range
                    const tDate = new Date(t.date)
                    if ((!start || tDate >= start) && (!end || tDate <= end)) {
                        expandedTransactions.push(t)
                    }
                } else {
                    // Recurring: expand within range
                    let current = new Date(t.date)
                    const tEnd = t.end_date ? new Date(t.end_date) : (end || new Date(current.getFullYear() + 2, current.getMonth()))
                    const limit = end && tEnd > end ? end : tEnd

                    while (current <= limit) {
                        if (!start || current >= start) {
                            expandedTransactions.push({
                                ...t,
                                date: current.toISOString().split('T')[0],
                                id: `${t.id}-${current.toISOString().split('T')[0]}`,
                                originalId: t.id,
                                isVirtual: true
                            })
                        }

                        // Increment based on frequency
                        if (t.frequency === 'MONTHLY') {
                            current.setMonth(current.getMonth() + 1)
                        } else if (t.frequency === 'YEARLY') {
                            current.setFullYear(current.getFullYear() + 1)
                        } else {
                            break // Fallback
                        }
                    }
                }
            })

        // Sort by date descending
        expandedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        return NextResponse.json({ transactions: expandedTransactions })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}

// POST: Add a budget transaction
export async function POST(request: Request) {
    try {
        const { projectId, amount, type, description, date, vendorId, clientId, frequency, endDate } = await request.json()

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
                end_date: endDate || null,
                vendor_id: vendorId || null,
                client_id: clientId || null,
                frequency: frequency || 'ONCE'
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

        // Handle virtual IDs (e.g., id-date)
        const realId = id.includes('-') && id.length > 36 ? id.split('-')[0] : id

        const { error } = await supabase
            .from('project_budgets')
            .delete()
            .eq('id', realId)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Deleted' })
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
